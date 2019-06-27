// TODO: very hacky way to get the image, need to find proper way of loading image
// _extractPolygonData(data) {
//   return data.map(row => {
//     const center = row.center.coordinates;
//     if (row.location && row.location.coordinates && row.location.coordinates.length > 0) {
//       return {
//         _id: row._id,
//         _index: row._index,
//         polygon: this._switchPolygonCoordinates(row.location.coordinates[0]),
//         center: [center[1], center[0]],
//         imageUrl: `${row.urls[0]}/${row._id}.interferogram.browse_coarse.png`
//       };
//     }
//   });
// }

_switchPolygonCoordinates = (polygon) => {
  return polygon.map((row) => [row[1], row[0]]);
};

exports._switchPolygonCoordinates = _switchPolygonCoordinates;

// custom function to handle how you extract geo spatial information from your data
/** expected return dataa structure
 * [
 *  {
 *    _id: <es id of document>,
 *    _index: <index of document>,
 *    polygon: ec. [ [-125.09335, 42.47589], ... ,[-125.09335, 42.47589] ], **YOU MIGHT NEED TO SWITCH THE COORDINATES TO CONVERT FROM ES TO LEAFLET
 *    center: [-125.09335, 42.47589],
 *    imageUrl: <str: url>
 *  }
 * ]
 */
exports._extractPolygonData = (data) => {
  let mapData = [];
  for (var i = 0; i < data.length; i++) {
    let row = data[i];
    if (row.location && row.location.coordinates && row.location.coordinates.length > 0) {
      const center = row.center.coordinates;
      mapData.push({
        _id: row._id,
        _index: row._index,
        polygon: _switchPolygonCoordinates(row.location.coordinates[0]),
        center: [center[1], center[0]],
        imageUrl: `${row.urls[0]}/${row._id}.interferogram.browse_coarse.png`
      });
    }
  }
  return mapData;
};
