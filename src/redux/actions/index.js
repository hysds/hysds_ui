export function addArticle(payload) {
  return {
    type: "ADD_ARTICLE",
    payload
  };
}

export function editPageSize(payload) {
  return {
    type: "PAGE_SIZE",
    payload
  };
}

// our new action creator. Will it work?}
export function getData(n) {
  console.log(`page size: ${n}`);
  return function(dispatch) {
    console.log("executing get request for posts");
    return fetch("https://jsonplaceholder.typicode.com/posts")
      .then(response => response.json())
      .then(json => {
        console.log("data fetched and dispatched to reducer");
        dispatch({ type: "DATA_LOADED", payload: json.slice(0, n) });
      });
  };
}
