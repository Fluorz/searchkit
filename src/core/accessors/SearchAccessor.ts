import {ValueState} from "../state"
import {Accessor} from "./Accessor"
import {SimpleQueryString} from "../query/QueryBuilders";

export class SearchAccessor extends Accessor<ValueState> {
  state = new ValueState()

  buildSharedQuery(query){
    return query.addQuery(
      SimpleQueryString(this.state.getValue()))
  }

}