import axios from "axios";
import fs from "fs";
import xmlFormat from "xml-formatter";
import {transformYandexData} from "./transformData.js";
import {createOsmXml, appendDataToXMl} from "./OSMParser.js";

function saveOsmXmlToFile(osmXml, fileName) {
    const xmlWithDeclaration = `<?xml version='1.0' encoding='UTF-8'?>${osmXml}`;
    fs.writeFile(fileName, xmlFormat(xmlWithDeclaration), (err) => {
        if (err) {
            console.error("Ошибка при сохранении файла:", err);
        } else {
            console.log(`Файл успешно сохранен: ${fileName}`);
        }
    });
}
async function geocode(data) {
    const yandexGeocodeApiUrl = "https://geocode-maps.yandex.ru/1.x";

    const requests = data.map(coord => {
        const params = {
            geocode: coord,
            apikey: "YOUR API KEY",
            format: "json",
        };

        return axios.get(yandexGeocodeApiUrl, { params });
    });

    try {
        const responses = await Promise.all(requests);
        const yandexDataArray = responses.map(response => {
            // console.log(response)
            if (response.data.response.GeoObjectCollection.featureMember.length > 0) {
                const geoObject = response.data.response.GeoObjectCollection.featureMember[0].GeoObject;
                const data = {
                    address: geoObject.name,
                    coordinates: geoObject.boundedBy,
                    point: geoObject.Point.pos
            };
                return (transformYandexData(data));
            } else {
                throw new Error("Не удалось найти объект по заданным координатам");
            }
        });
        return yandexDataArray;
    } catch (error) {
        console.error("Ошибка при выполнении геокодирования:", error);
        return null;
    }
}

const filePath = './data.geojson';
 function readCoordFromGeoJsonFile(filePath) {
    try {
        const fileContent =  fs.readFileSync(filePath, 'utf-8');
        const geojsonData = JSON.parse(fileContent);
        let coord = []
        geojsonData.features.forEach((obj, i)=>{
            coord.push(obj.geometry.coordinates.toString())
        });
        return coord;
    } catch (error) {
        console.error('Error reading GeoJSON file:', error);
    }
}

const data =  readCoordFromGeoJsonFile(filePath);

geocode(data)
    .then(yandexData => {
        if (yandexData) {
            let append = false
            if ( append) {
                appendDataToXMl("./map.osm", yandexData)
            } else  {
                const osmXml = createOsmXml(yandexData);
                const fileName = "output.osm";
                saveOsmXmlToFile(osmXml, fileName);
            }

        }
    });

