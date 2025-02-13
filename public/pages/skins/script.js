(function () {
    const initialFolderId = new URL(location.href).searchParams.get('folder');

    const explorer = document.querySelector('.skins-explorer');

    const CACHE_EXPIRE_TIME = 10000;

    function clearExplorer() {
        explorer.innerHTML = '';
    }

    function hasCache(id) {
        const b64_cache = localStorage.getItem("skins_cache");
        if (!b64_cache) return false;
        const cache = JSON.parse(b64_cache);
        return cache[id] && cache[id].expires && Date.now() <= cache[id].expires;
    }
    
    function saveCache(id, data) {
        let cache = localStorage.getItem("skins_cache");
        if (!cache) cache = {};
        else cache = JSON.parse(cache);
        cache[id] = { expires: Date.now() + CACHE_EXPIRE_TIME, ...data };
        localStorage.setItem("skins_cache", JSON.stringify(cache));
    }

    function getCache(id) {
        const b64_cache = localStorage.getItem("skins_cache");
        if (!b64_cache) return false;
        return JSON.parse(b64_cache)[id];
    }

    function addEntitiesToExplorer(id, data) {
        saveCache(id, data);
        clearExplorer();
        let {entidades, parente} = data;

        if (parente !== null) {
            addEntity({ id: parente, nome: ".." });
        }

        entidades.forEach(addEntity);
    }

    async function exploreTo(id='') {
        OnLoadingScreen();

        let json;
        if (hasCache(id)) {
            json = { success: true, data: getCache(id) };
        }

        if (!json) {
            const response = await fetch(`/API/skins?folder=${id}`);
            json = await response.json();
        }

        if (json.success) addEntitiesToExplorer(id, json.data)
        else alert(json.message);

        OffLoadingScreen();
    }

    function addEntity({ id, nome, tipo = "pasta", trancado = false }) {
        const icones = { pasta: "folder_open", skin: "image" };

        const li = document.createElement("li");
        li.innerHTML = `<span class="material-symbols-outlined">${icones[tipo]}</span>`;
        li.append(nome);
        
        if (trancado) {
            li.innerHTML += `<span class="material-symbols-outlined locked">lock</span>`;
        }

        explorer.append(li);

        if (trancado) {
            li.onclick = () => {
                const form = document.getElementById("novo-post-form");
                form.reset();
                form.dataset.for = id;
                abrirBetterPopup("senha-popup");
            }
        } else {
            li.onclick = () => exploreTo(id);
        }
    }

    window.addEventListener("load", function () {
        const form = document.getElementById("novo-post-form");
        const status = form.querySelector('.form-status');

        form.onsubmit = async (ev) => {
            ev.preventDefault();
            OnLoadingScreen();
    
            const id = form.dataset.for;
            if (!id) return;
    
            const senha = form.querySelector("input").value.trim();
            if (!senha) {
                status.innerHTML = 'O campo está vazio<br><span style="font-size: 0.7rem">(espaços não contam como senha)!</span>';
                OffLoadingScreen();
                return false;
            };

            const response = await fetch(`/API/skins?folder=${id}&senha=${senha}`);
            const json = await response.json();

            if (!json.success) {
                status.innerHTML = json.message;
                OffLoadingScreen();
                return false;
            }

            addEntitiesToExplorer(id, json.data);
            
            fecharBetterPopup("senha-popup");
            OffLoadingScreen();
        };
    });

    exploreTo();
})();
