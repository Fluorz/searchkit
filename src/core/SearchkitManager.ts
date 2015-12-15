
import {State,ArrayState,ObjectState,ValueState} from "./state"
import {ImmutableQuery} from "./query/ImmutableQuery";
import {Accessor} from "./accessors/Accessor"
import {Searcher} from "./Searcher"
import {ESMultiRequest} from "./ESMultiRequest";
import {history} from "./history";

require('es6-promise').polyfill()

export class SearchkitManager {
  searchers:Array<Searcher>
  index:string
  private registrationCompleted:Promise<any>
  completeRegistration:Function
  state:any
  translateFunction:Function
  defaultQueries:Array<Function>

  constructor(index:string){
    this.index = index
    this.searchers = []
		this.registrationCompleted = new Promise((resolve)=>{
			this.completeRegistration = resolve
		})
    this.listenToHistory(history)
    this.defaultQueries = []
    this.translateFunction = _.identity
  }
  addSearcher(searcher){
    this.searchers.push(searcher)
    searcher.setSearchkitManager(this)
  }

  addDefaultQuery(fn:Function){
    this.defaultQueries.push(fn)
  }
  translate(key){
    return this.translateFunction(key)
  }

  createSearcher(){
    var searcher = new Searcher()
    this.addSearcher(searcher)
    return searcher
  }

  getAccessors(){
    return _.chain(this.searchers)
      .pluck("accessors")
      .flatten()
      .value()
  }

  iterateAccessors(fn){
    var accessors = this.getAccessors()
    _.each(accessors, fn)

  }

  resetState(){

    this.iterateAccessors((accessor)=>{
      accessor.resetState()
    })
  }

  getState(){
    var state = {}
    this.iterateAccessors((accessor)=>{
      var val = accessor.state.getValue()
      if(val){
        state[accessor.urlKey] = val
      }
    })
    return state
  }

  hasState(){
    return !_.isEmpty(this.getState())
  }

  buildSharedQuery(){
    var query = new ImmutableQuery()
    query = _.reduce(this.defaultQueries, (currentQuery, fn)=>{
      return fn(currentQuery)
    }, query)
    this.iterateAccessors((accessor)=>{
      query = accessor.buildSharedQuery(query)
    })
    return query
  }

  makeQueryDef(){
    var queryDef = {
      queries:[],
      searchers:[]
    }
    var query = this.buildSharedQuery()
    _.each(this.searchers, (searcher)=>{
      searcher.buildQuery(query)
      if(searcher.queryHasChanged){
        queryDef.queries = queryDef.queries.concat(
          searcher.getCommandAndQuery()
        )
        queryDef.searchers.push(searcher)
      }
    })
    return queryDef
  }

  listenToHistory(history){
    history.listen((location)=>{
      //action is POP when the browser modified
      if(location.action === "POP") {
        this.registrationCompleted.then(()=>{
          this.setAccessorStates(location.query)
          this._search()
        })
      }
    })
  }

  setAccessorStates(query){
    this.iterateAccessors((accessor)=>{
      var value = query[accessor.urlKey]
      accessor.state = accessor.state.setValue(value)
    })
  }

  notifyStateChange(oldState){
    this.iterateAccessors((accessor)=>{
      accessor.onStateChange(oldState)
    })
  }

  performSearch(){
    this.notifyStateChange(this.state)
    this._search()
    console.log(this.state)
    history.pushState(null, window.location.pathname, this.state)
  }
  search(){
    this.performSearch()
  }

  _search(){
    this.state = this.getState()
    var queryDef = this.makeQueryDef()
    console.log("multiqueries", queryDef.queries)

    if(queryDef.queries.length > 0) {
      var request = new ESMultiRequest()
      request.search(queryDef.queries).then((response)=> {
        _.each(response["responses"], (results, index)=>{
          queryDef.searchers[index].setResults(results)
        })
      })
    }
  }

}