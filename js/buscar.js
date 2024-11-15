function searchContent(domTree, page) {
    const query = document.getElementById("searchInput").value;
    const resultsContainer = document.querySelector("aside > section");
    
    // Create a regular expression (with "i" for case-insensitive search)
    const regex = new RegExp(query, "i");

    // Variable to check if at least one result was found
    let found = false;

    const addedElements = [];
    const processedElements = new Set();

    function deepSearch(elemento) {
        // Skip if the element or its parent has already been processed
        if (processedElements.has(elemento) || processedElements.has(elemento.parentElement)) {
            return;
        }

        // Remove <header> elements from the element
        const headers = elemento.querySelectorAll("header");
        headers.forEach(header => header.remove());

        // Take the text content of the element
        const texto = elemento.innerText || elemento.textContent;
        
        // Obtain the title from the DOM tree
        const titleElement = domTree.querySelector("title");
        const title = titleElement ? titleElement.innerText : "Sin título";

        // Check if the text matches the search query
        if (regex.test(texto)) {
            // Check if the text is similar to any already added element
            let isSimilar = addedElements.some(addedText => jaccardSimilarity(addedText, texto) > 0.8);
            
            if (!isSimilar) {
                found = true;
                addedElements.push(texto);
                processedElements.add(elemento);
                
                // Clone the element and highlight the match
                const words = texto.split(/\s+/);
                const matchIndex = words.findIndex(word => regex.test(word));
                const start = Math.max(0, matchIndex - 2);
                const end = Math.min(words.length, matchIndex + 3);
                const snippet = words.slice(start, end).join(" ");
                const highlightedSnippet = snippet.replace(regex, match => `<mark>${match}</mark>`);
                const resultItem = document.createElement("div");
                resultItem.innerHTML = `<a href="${page}"><h3>${elemento.closest("h3") ? elemento.closest("h3").innerText : title}</h3><p>... ${highlightedSnippet} ...</p></a>`;
                
                // Add the result to the container
                resultsContainer.appendChild(resultItem);
            }
        }
    }

    // Start deep search from the body element
    deepSearch(domTree.body);


}

// Function to calculate Jaccard similarity between two strings
function jaccardSimilarity(str1, str2) {
    const set1 = new Set(str1.split(/\s+/));
    const set2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

const files = ["UX-Pagina-Personal/index.html", "UX-Pagina-Personal/contacto.html", "UX-Pagina-Personal/proyectos.html"];

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

// Function to read HTML files and execute the search sequentially
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

// Call the executeSearch function when the search button is clicked
document.querySelector("button").addEventListener("click", executeSearch);