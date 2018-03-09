const URL = {
    DOMAIN: `http://vumoo.to`,
    DOMAIN_CDN: 'http://cdn.123moviesapp.net',
    SEARCH: (title) => {
        return `http://vumoo.to/search?q=${title}`;
    }
};

class Vumoo {
    constructor(props) {
        this.libs       = props.libs;
        this.movieInfo  = props.movieInfo;
        this.settings   = props.settings;
        this.state      = {};
    }

    async searchDetail() {

        const { httpRequest, cheerio, stringHelper, base64 } = this.libs; 
        let { title, year, season, episode, type } = this.movieInfo;

        let detailUrl       = false;
        let urlSearch       = URL.SEARCH(encodeURI(title));
        let jsonSearch      = await httpRequest.get(urlSearch);
        jsonSearch          = jsonSearch.data;

        jsonSearch.suggestions.map(function(val) {

            let hrefMovie   = URL.DOMAIN + val.data.href;
            let typeMovie   = val.data.type;
            let titleMovie  = val.value;
            let yearMovie   = titleMovie.match(/\(([0-9]+)\)/i);
            yearMovie       = yearMovie != null ? +yearMovie[1] : 0;
            titleMovie      = titleMovie.replace(/\([0-9]+\)/i, '').trim();
            let seasonMovie = titleMovie.match(/ *season *([0-9]+)/i);
            seasonMovie     = seasonMovie != null ? +seasonMovie[1] : false;


            
            if( seasonMovie != false ) {
                titleMovie = titleMovie.replace(/ *season.*/i, '');
            }


            if( stringHelper.shallowCompare(title, titleMovie) ) {

                if( typeMovie == 'movies' && type == 'movie' && yearMovie == year ) {

                    detailUrl = hrefMovie;                    
                } else if( typeMovie == 'tv-series' && type == 'tv' && seasonMovie == season ) {

                    detailUrl = hrefMovie;
                }
            }
        });

        this.state.detailUrl = detailUrl;
        return;
    }


    async getHostFromDetail() {

        const { httpRequest, cheerio, base64, cryptoJs } = this.libs;
        let { episode }                                 = this.movieInfo;
        if(!this.state.detailUrl) throw new Error("NOT_FOUND");

        let hosts           = [];
        let arrRedirect     = [];
        let arrLinkEmbed    = [];

        let detailUrl       = this.state.detailUrl;
        let htmlDetail      = await httpRequest.getHTML(this.state.detailUrl);
        let $               = cheerio.load(htmlDetail);
        let itemServer      = $('.tab-content .tab-pane ul li');

        itemServer.each(function() {
            
            let episodeMovie = $(this).find('a').text();
            episodeMovie     = episodeMovie.match(/s[0-9]+e([0-9]+)/i);
            episodeMovie     = episodeMovie != null ? +episodeMovie[1] : -1;
            
            if( episodeMovie == episode ) {

                let linkRedirect = $(this).find('a').attr('embedurl');
                arrRedirect.push(linkRedirect);
            }
            
        });

        let arrPromise = arrRedirect.map(async function(val) {

            let htmlRedirect    = await httpRequest.getHTML(val);
            let token           = htmlRedirect.match(/embedVal\=\"([^\"]+)/i);
            token               = token != null ? token[1] : false;

            if( token != false ) {

                let linkEmbed       = cryptoJs.AES.decrypt(token, 'iso10126').toString(cryptoJs.enc.Utf8);

                try {

                    linkEmbed = JSON.parse(linkEmbed);
                    
                    for( let item in linkEmbed.videos ) {

                        arrLinkEmbed.push(linkEmbed.videos[item].url);
                    }
                    
                } catch(error) {}
                
            }

        });


        
        await Promise.all(arrPromise);


        let arrPromiseEmbed = arrLinkEmbed.map(async function(val) {

            if( val.indexOf('http:') == -1 && val.indexOf('https:') == -1 ) {

                let urlDirect   = URL.DOMAIN_CDN + val;
                let linkDirect  = await httpRequest.get(urlDirect);
                linkDirect      = linkDirect.data;

                for( let item in linkDirect ) {
                    
                    console.log(linkDirect[item].file);
                    linkDirect[item].file && hosts.push({
                        provider: {
                            url: detailUrl,
                            name: "vumoo"
                        },
                        result: {
                            file: linkDirect[item].file,
                            label: "embed",
                            type: "direct"
                        }
                    });
                }
            } else {
                hosts.push({
                    provider: {
                        url: detailUrl,
                        name: "vumoo"
                    },
                    result: {
                        file: val,
                        label: "embed",
                        type: "embed"
                    }
                });
            }
        });

        await Promise.all(arrPromiseEmbed);

        this.state.hosts = hosts;
        return;
    }

}

exports.default = async (libs, movieInfo, settings) => {

    const vumoo = new Vumoo({
        libs: libs,
        movieInfo: movieInfo,
        settings: settings
    });
    await vumoo.searchDetail();
    await vumoo.getHostFromDetail();
    return vumoo.state.hosts;
}


exports.testing = Vumoo;