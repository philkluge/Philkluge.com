document.addEventListener('DOMContentLoaded', function ()
{
    (function ()
    {
        var select = document.getElementById("theme-select");
        if (!select) return; 

        window.THEMES.forEach(function (t)
        {
            var opt = document.createElement("option");
            opt.value = t.id;
            opt.textContent = t.name;
            if (window.ACTIVE_THEME && t.id === window.ACTIVE_THEME.id)
            {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        select.addEventListener("change", function ()
        {
            if (!window.CookieConsent || window.CookieConsent.canStore())
            {
                localStorage.setItem("selectedTheme", select.value);
            }
            location.reload();
        });
    })();

    fetch('/SRC/footer.html')
        .then(r => r.text())
        .then(h => document.getElementById('footer-placeholder').innerHTML = h);

    (async function ()
    {
        const langSelect = document.getElementById('lang-select');
        let currentLang = localStorage.getItem('selectedLang') || 'en';
        if (langSelect) langSelect.value = currentLang;
        document.documentElement.lang = currentLang;

        let translations = {};
        const response = await fetch('/SRC/translations.json');
        translations = await response.json();

        function applyTranslations(lang)
        {
            if (!translations[lang]) return;

            const elements = document.querySelectorAll('[data-i18n]');
            elements.forEach(el =>
            {
                const key = el.getAttribute('data-i18n');
                if (translations[lang][key])
                {
                    el.textContent = translations[lang][key];
                }
            });
        }

        window.applyTranslations = applyTranslations;

        applyTranslations(currentLang);

        if (langSelect)
        {
            langSelect.addEventListener('change', function ()
            {
                currentLang = this.value;
                if (!window.CookieConsent || window.CookieConsent.canStore())
                {
                    localStorage.setItem('selectedLang', currentLang);
                }
                document.documentElement.lang = currentLang;
                applyTranslations(currentLang);
            });
        }
    })();

    (async function ()
    {
        var STORAGE_KEY = 'cookieConsent';

        window.CookieConsent =
        {
            value: function () { return localStorage.getItem(STORAGE_KEY); },
            canStore: function () { return localStorage.getItem(STORAGE_KEY) !== 'declined'; }
        };

        const response = await fetch('/SRC/cookie-banner.html');
        const html = await response.text();
        document.getElementById('cookie-banner-placeholder').innerHTML = html;

        var banner = document.getElementById('cookie-banner');

        function hide ()
        {
            banner.classList.remove('is-visible');
        }

        banner.querySelector('.cb-accept').addEventListener('click', function ()
        {
            localStorage.setItem(STORAGE_KEY, 'accepted');
            hide();
        });

        banner.querySelector('.cb-decline').addEventListener('click', function ()
        {
            localStorage.setItem(STORAGE_KEY, 'declined');
            localStorage.removeItem('selectedTheme');
            localStorage.removeItem('selectedLang');
            hide();
        });

        if (window.applyTranslations)
        {
            window.applyTranslations(document.documentElement.lang);
        }

        if (!window.CookieConsent.value())
        {
            requestAnimationFrame(function () { banner.classList.add('is-visible'); });
        }
    })();
});