export function transformYandexData(yandexApiResponse) {
    const address = yandexApiResponse.address;
    // const lowerCorner = yandexApiResponse.coordinates.Envelope.lowerCorner.split(" ");
    const point = yandexApiResponse.point.split(" ");
    // console.log('lover' + lowerCorner);
    // console.log('upper' + upperCorner);
    const latMin = parseFloat(point[1]);
    const lonMin = parseFloat(point[0]);
    const latMax = parseFloat(point[1] + Number.EPSILON);
    const lonMax = parseFloat(point[0] + Number.EPSILON);

    const coordinates = [
        [latMin, lonMin],
        [latMin, lonMax],
        [latMax, lonMax],
        [latMax, lonMin],
    ];

    return {
        address,
        coordinates,
    };
}