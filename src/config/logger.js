const isProd = process.env.NODE_ENV === "production";

const format = (level, msg, meta) => {
  const base = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${msg}`;
  return meta ? `${base} | ${typeof meta === "string" ? meta : JSON.stringify(meta)}` : base;
};

export const logger = {
  info: (msg, meta) => console.log(format("info", msg, meta)),
  warn: (msg, meta) => console.warn(format("warn", msg, meta)),
  error: (msg, meta) => console.error(format("error", msg, meta)),
  debug: (msg, meta) => {
    if (!isProd) console.debug(format("debug", msg, meta));
  },
};
