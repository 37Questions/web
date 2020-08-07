class Api {
  static ENDPOINT = "http://192.168.0.102:3000";

  static async getUser(attempt = 0) {
    const USER_KEY = "questions-user";

    return new Promise((resolve) => {
      if (attempt > 3) {
        console.error("User setup failed too many times, giving up.");
        return resolve(false);
      }

      const savedUser = localStorage.getItem(USER_KEY);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        const req = `/validate-token?id=${user.id}&token=${user.token}`;
        fetch(Api.ENDPOINT + req, {method: "GET"}).then((res) => {
          res.json().then((res) => {
            if (res.valid) {
              return resolve(res.user);
            }
            console.warn("Cached user was invalid, attempting to create a new account");
            localStorage.removeItem(USER_KEY);
            return Api.getUser(attempt++);
          });
        });
      } else {
        fetch(Api.ENDPOINT + "/user", {method: "POST"}).then((res) => {
          res.json().then((user) => {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            resolve(user);
          });
        });
      }
    });
  }

  static generateHue() {
    return Math.floor(Math.random() * 360);
  }

  static async getIcons() {
    return fetch(Api.ENDPOINT + "/icons", {method: "GET"}).then((res) => {
      return res.json().then((res) => {
        const icons = [];
        res.icons.forEach((icon) => {
          icons.push({
            name: icon,
            backgroundColor: this.generateHue(),
            color: this.generateHue(),
          });
        });
        return icons;
      });
    });
  }

  static async setupUser(user, name, icon) {
    return fetch(Api.ENDPOINT + "/setup-acc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user: {
          id: user.id,
          token: user.token
        },
        name: name,
        icon: {
          name: icon.name,
          color: icon.color,
          backgroundColor: icon.backgroundColor
        }
      })
    }).then((res) => {
      return res.json().then((res) => {
        return res.error;
      });
    })
  }
}

export default Api;