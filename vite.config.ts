/**
 * @type {import('vite').UserConfig}
 **/

const prod = "https://aaron.as";

const config = {
  server: {
    proxy: {
      "/media": prod,
      "/3cb5433c.txt": prod,
    },
  },
};

export default config;
