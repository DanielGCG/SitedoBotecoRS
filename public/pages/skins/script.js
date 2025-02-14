window.addEventListener("load", function () {
    const getInitialFolder = () => new URL(location.href).searchParams.get('folder');

    const CACHE_EXPIRE_TIME = 10000;

    const Cache = {
        has(id) {
            const b64_cache = localStorage.getItem("skins_cache");
            if (!b64_cache) return false;
            const cache = JSON.parse(b64_cache);
            return cache[id] && cache[id].expires && Date.now() <= cache[id].expires;
        },

        save(id, data) {
            let cache = localStorage.getItem("skins_cache");
            if (!cache) cache = {};
            else cache = JSON.parse(cache);
            cache[id] = { expires: Date.now() + CACHE_EXPIRE_TIME, ...data };
            localStorage.setItem("skins_cache", JSON.stringify(cache));
        },

        get(id) {
            const b64_cache = localStorage.getItem("skins_cache");
            if (!b64_cache) return false;
            return JSON.parse(b64_cache)[id];
        }
    };

    const API = {
        /** @private */
        async _fetch({ id, senha }) {
            const resource = `/API/skins?folder=${id}&senha=${senha}`;
            const response = await fetch(resource);

            //if (!response.ok) 

            return await response.json();
        },

        fetchUnprotectedFolder(id) {
            return this._fetch({ id });
        },

        fetchProtectedFolder(id, senha) {
            return this._fetch({ id, senha });
        }
    };

    const Explorer = {
        // Por alguma razão, this.element está sendo ignorado completamente
        // então só tirei ele. Foi mal pelo bad code ;P

        clear() {
            document.querySelector('.skins-explorer').innerHTML = '';
        },

        async goto(id='') {
            LoadingScreen.Open();

            let json;
            if (Cache.has(id)) {
                json = { success: true, data: Cache.get(id) };
            }

            if (!json) json = await API.fetchUnprotectedFolder(id);

            if (json.success) this.addEntities(id, json.data)
            else alert(json.message);

            LoadingScreen.Close();
        },

        /** @private */
        _addEntity({ id, nome, tipo = "pasta", trancado = false }) {
            const icones = { pasta: "folder_open", skin: "image" };

            const li = document.createElement("li");
            li.innerHTML = `<span class="material-symbols-outlined">${icones[tipo]}</span>`;
            li.append(nome);
            
            if (trancado) {
                li.innerHTML += `<span class="material-symbols-outlined locked">lock</span>`;
            }

            document.querySelector('.skins-explorer').append(li);

            if (trancado) {
                li.onclick = () => {
                    const form = document.getElementById("novo-post-form");
                    form.reset();
                    form.dataset.for = id;
                    BetterPopup.abrir("senha-popup");
                }
            } else {
                li.onclick = () => Explorer.goto(id);
            }
        },

        addEntities(id, data) {
            Cache.save(id, data);
            this.clear();

            let {entidades, parente} = data;

            entidades.forEach(this._addEntity);
        }
    };

    const PasswordPopup = {
        elements: {
            form: document.getElementById("novo-post-form"),
            status: document.querySelector('#novo-post-form .form-status'),
            input: document.querySelector("#novo-post-form input[type=password]")
        },

        init() {
            this.elements.form.addEventListener('submit', this._onSubmit);
        },

        /** @event @private */
        async _onSubmit(ev) {
            ev.preventDefault();
            LoadingScreen.Open();
    
            const id = this.elements.form.dataset.for;
            if (!id) return;
    
            const senha = this.elements.input.value.trim();
            if (!senha) {
                this.elements.status.innerHTML = 'O campo está vazio<br><span style="font-size: 0.7rem">(espaços não contam como senha)!</span>';
                LoadingScreen.Close();
                return false;
            };

            const json = await API.fetchProtectedFolder(id, senha);

            if (!json.success) {
                status.innerHTML = json.message;
                LoadingScreen.Close();
                return false;
            }

            Explorer.addEntities(id, json.data);
            
            BetterPopup.fechar("senha-popup");
            LoadingScreen.Close();
        }
    };

    PasswordPopup.init();
    Explorer.goto();
});
