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

        if (json.success) {
            saveCache(id, json.data);
            clearExplorer();
            let {entidades, parente} = json.data;

            if (parente !== null) {
                addFolder({ id: parente, nome: ".." });
            }

            for (let entity of entidades) {
                let func = entity.tipo === "pasta" ? addFolder : addSkin;
                func(entity);
            }
        }

        OffLoadingScreen();
    }

    function addFolder({ id, nome }) {
        const li = document.createElement("li");
        li.innerHTML = '<span class="material-symbols-outlined">folder_open</span>';
        li.append(nome);
        explorer.append(li);
        li.onclick = () => exploreTo(id);
    }

    function addSkin({ id, nome }) {
        const li = document.createElement("li");
        li.innerHTML = '<span class="material-symbols-outlined">image</span>';
        li.append(nome);
        explorer.append(li);
    }

    exploreTo();
})();
