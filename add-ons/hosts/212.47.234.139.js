class FastServer {

    constructor(props) {

        this.libs       = props.libs;
        this.settings   = props.settings;
        this.state      = {};
    }

    convertToEmbed() {
        
        // convert link detail to link embed
        // if input is embed then return input
    }

    async getLink(url) {

        const { httpRequest, cheerio } = this.libs;
        
        let results = [];

        // let isDie = 'NOR';
        // try {
        //     isDie       = await httpRequest.isLinkDie(url);
        // } catch(error) {}
    
        // if( isDie != false ) {

            results.push({
                file: url, label: 'HD', type: "direct" , size: 'NOR' 
            });
        // }

        return {
            host: {
                url: url,
                name: "Fast-Server"
            },
            result: results
        }

    }
}

exports.default = (libs, settings) => new FastServer({ libs, settings });