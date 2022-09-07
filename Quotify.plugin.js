/**
 * @name Quotify 
 * @author zukijifukato 
 * @description Set random quote as custom status at interval
 * @version 0.0.1
 * @invite inviteCode
 * @authorId 775252975643263006
 * @authorLink https://twitter.com/zukijifukato
 * @website https://github.com/zukijifukato/Quotify
 */

module.exports = class Quotify {
  constructor(meta) {
    this.quotes = [];
    this.timeout = 30000;

    Status.authToken = BdApi.Webpack.getModule(m => m.default && m.default.getToken).default.getToken();
		this.currentUser = BdApi.Webpack.getModule(m => m.default && m.default.getCurrentUser).default.getCurrentUser();
    console.log(Status.authToken, this.currentUser);
  }

  start() {
    this.mainLoop();
  }

  mainLoop() {
    let shouldContinue = true;
		this.loop = undefined;
		this.cancel = () => { shouldContinue = false; };

    fetch("https://api.quotable.io/random")
      .then(res => res.json())
      .then(data=> {
        if(data.content.length < 128) {
          Status.Set({ text: data.content });
        }

        this.cancel = undefined;

        if (shouldContinue) {
          this.loop = setTimeout(() => {
            this.mainLoop();
          }, this.timeout);
        }
      });
  }

  stop() {
    if (this.cancel) {
			this.cancel();
		} else {
			console.assert(this.loop != undefined);
			clearTimeout(this.loop);
		}
		Status.Set(null);
  }
};

const Status = {
	strerror: (req) => {
		if (req.status  < 400) return undefined;
		if (req.status == 401) return "Invalid AuthToken";

		// Discord _sometimes_ returns an error message
		let json = JSON.parse(req.response);
		for (const s of ["errors", "custom_status", "text", "_errors", 0, "message"])
			if ((json == undefined) || ((json = json[s]) == undefined))
				return "Unknown error";

		return json;
	},

	Set: async (status) => {
		let req = new XMLHttpRequest();
		req.open("PATCH", "/api/v9/users/@me/settings", true);
		req.setRequestHeader("authorization", Status.authToken);
		req.setRequestHeader("content-type", "application/json");
		req.onload = () => {
			let err = Status.strerror(req);
			if (err != undefined)
				BdApi.showToast(`Animated Status: Error: ${err}`, {type: "error"});
		};
		if (status === {}) status = null;
		req.send(JSON.stringify({custom_status: status}));
	},
};
