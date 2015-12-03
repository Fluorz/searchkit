import {State,ArrayState,ObjectState,ValueState} from "./State.ts"
import {ImmutableQuery} from "./ImmutableQuery.ts";

class Accessor<T extends State<any>> {
  key:string
  state:T
  buildSharedQuery(){

  }
  buildOwnQuery(){

  }
}

class Searcher {
  accessors:Array<Accessor<any>>
  query:ImmutableQuery
  constructor(){
    this.accessors = []
  }
  addAccessor(accessor:Accessor<any>){
    this.accessors.push(accessor)
  }
  buildQuery(query){
    _.each(this.accessors, (accessor)=>{
      query = accessor.buildOwnQuery(query)
    })
    this.queryHasChanged = ImmutableQuery.areQueriesDifferent(
      this.query, query)
    this.query = query
  }
}

class SearchkitManager {
  searchers:Array<Searcher>
  constructor(){
    this.searchers = []
  }
  getAccessors(){
    return _.chain(this.searchers)
      .pluck("accessors")
      .flatten()
      .value()
  }
  buildSharedQuery(){
    var query = new ImmutableQuery()
    var accessors = this.getAccessors()
    _.each(accessors, (accessor)=>{
      query = accessor.buildSharedQuery(query)
    })
    return query
  }
  search(){
    var query = this.buildSharedQuery()
    _.each(this.searchers, (searcher)=>{
      searcher.
    })
  }

}