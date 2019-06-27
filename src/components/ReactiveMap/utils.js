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
