import {JSDOM} from "jsdom";
import fs from "fs";

function nodeElementSFromArray(osmDocument, yandexDataArray, append = false) {
    // Находим тег <bounds> в документе
    const boundsElement = osmDocument.querySelector("bounds");

    yandexDataArray.forEach((yandexData, i) => {
        const { address, coordinates } = yandexData;
        // Разбиваем адрес на улицу и номер дома
        const [street, houseNumber] = address
            .split(",")
            .map((part) => part.trim());

        // Создаем узлы для каждой координаты
        coordinates.forEach((coord, index) => {
            const nodeElement = osmDocument.createElement("node");
            nodeElement.setAttribute("id", -(i * 1000 + index + 1));
            nodeElement.setAttribute("visible", "true");
            nodeElement.setAttribute("lat", coord[0]);
            nodeElement.setAttribute("lon", coord[1]);
            osmDocument.documentElement.appendChild(nodeElement);
        });

        // Создаем элемент way и добавляем ссылки на узлы
        const wayElement = osmDocument.createElement("way");
        wayElement.setAttribute("id", -(i + 1));
        wayElement.setAttribute("visible", "true");

        coordinates.forEach((_, index) => {
            const ndElement = osmDocument.createElement("nd");
            ndElement.setAttribute("ref", -(i * 1000 + index + 1));
            wayElement.appendChild(ndElement);
        });

        // Замыкаем последний узел с первым
        const ndElement = osmDocument.createElement("nd");
        ndElement.setAttribute("ref", -(i * 1000 + 1));
        wayElement.appendChild(ndElement);

        // Добавляем теги с адресом и типом здания
        const addrStreetTag = osmDocument.createElement("tag");
        addrStreetTag.setAttribute("k", "addr:street");
        addrStreetTag.setAttribute("v", street);
        wayElement.appendChild(addrStreetTag);

        const addrHouseNumberTag = osmDocument.createElement("tag");
        addrHouseNumberTag.setAttribute("k", "addr:housenumber");
        addrHouseNumberTag.setAttribute("v", houseNumber);
        wayElement.appendChild(addrHouseNumberTag);

        const buildingTag = osmDocument.createElement("tag");
        buildingTag.setAttribute("k", "building");
        buildingTag.setAttribute("v", "yes");
        wayElement.appendChild(buildingTag);

        if (append) {
            boundsElement.parentNode.insertBefore(wayElement, boundsElement.nextSibling);
        } else {
            // Добавляем элемент way в документ
            osmDocument.documentElement.appendChild(wayElement);
        }

    })
    return osmDocument;
}
export function appendDataToXMl(osmFile, yandexDataArray) {
// Читаем содержимое .osm файла
    const osmFileContent = fs.readFileSync(osmFile, "utf8");

    // Создаем JSDOM объект из содержимого файла
    const dom = new JSDOM(osmFileContent);
    const osmDocument = dom.window.document;

    const finalDoc = nodeElementSFromArray(osmDocument, yandexDataArray, true)

    // Возвращаем обновленный XML документ в виде строки
    return `<?xml version='1.0' encoding='UTF-8'?>${finalDoc.documentElement.outerHTML}`;

}

export function createOsmXml(yandexDataArray) {

    // Создаем новый XML документ для OSM
    const dom = new JSDOM();
    const osmDocument = dom.window.document.implementation.createDocument(null, "osm", null);

    // Устанавливаем атрибуты версии и генератора
    osmDocument.documentElement.setAttribute("version", "0.6");
    osmDocument.documentElement.setAttribute("generator", "JOSM");

    const finalDoc = nodeElementSFromArray(osmDocument, yandexDataArray)
    // Возвращаем XML строку
    return finalDoc.documentElement.outerHTML;
}
