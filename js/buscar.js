function searchContent(domTree, page) {
    const query = document.getElementById("searchInput").value;
    const resultsContainer = document.querySelector("aside > section");
    
    const regex = new RegExp(query, "i");

    let found = false;

    const addedElements = [];
    const processedElements = new Set();

    function deepSearch(elemento) {
        if (processedElements.has(elemento) || processedElements.has(elemento.parentElement)) {
            return;
        }

        const headers = elemento.querySelectorAll("header");
        headers.forEach(header => header.remove());

        const footers = elemento.querySelectorAll("footer");
        footers.forEach(footer => footer.remove());

        const texto = elemento.innerText || elemento.textContent;
        
        const titleElement = domTree.querySelector("title");
        const title = titleElement ? titleElement.innerText : "Sin título";

        if (regex.test(texto)) {
            let isSimilar = addedElements.some(addedText => jaccardSimilarity(addedText, texto) > 0.8);
            
            if (!isSimilar) {
                found = true;
                addedElements.push(texto);
                processedElements.add(elemento);
                
                const words = texto.split(/\s+/);
                const matchIndex = words.findIndex(word => regex.test(word));
                const start = Math.max(0, matchIndex - 2);
                const end = Math.min(words.length, matchIndex + 3);
                const snippet = words.slice(start, end).join(" ");
                const highlightedSnippet = snippet.replace(regex, match => `<mark>${match}</mark>`);
                const resultItem = document.createElement("div");
                const parts = page.split("/");
                const pageName = parts[1] ? parts[1] + "/" + (parts[2] || "") : "";
                resultItem.innerHTML = `<a href="${pageName}"><h3>${elemento.closest("h3") ? elemento.closest("h3").innerText : title}</h3><p>... ${highlightedSnippet} ...</a>`;
                
                resultsContainer.appendChild(resultItem);
            }
        }
    }

    deepSearch(domTree.body);


}

function jaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

const files = ["UX-Pagina-Personal/index.html", "UX-Pagina-Personal/contacto.html", "UX-Pagina-Personal/proyectos.html", "UX-Pagina-Personal/proyectos/randomPeace.html"];

async function leerContenidoArchivo(archivo) {
    const response = await fetch(`../${archivo}`);
    const contenido = await response.text();
    return contenido;
}

async function obtenerDOMDeArchivoHTML(archivo) {
    const contenido = await leerContenidoArchivo(archivo);
    const parser = new DOMParser();
    const dom = parser.parseFromString(contenido, 'text/html');
    return dom;
}

async function executeSearch() {
    const resultsContainer = document.querySelector("aside > section");
    resultsContainer.innerHTML = "";
    try {
        for (const file of files) {
            const domTree = await obtenerDOMDeArchivoHTML(file);
            searchContent(domTree, file);
        }
        
        if (resultsContainer.innerHTML === "") {
            resultsContainer.innerHTML = "<p>No se encontraron resultados.</p>";
        }
    } catch (error) {
        console.error("Error executing search:", error);
    }
}

document.querySelector("button").addEventListener("click", executeSearch);