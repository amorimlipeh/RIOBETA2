const path = require("path");
module.exports = {
  root: path.join(__dirname, "../.."),
  data: path.join(__dirname, "../../data"),
  uploads: path.join(__dirname, "../../uploads"),
  backups: path.join(__dirname, "../../backups"),
  public: path.join(__dirname, "../../public")
};
