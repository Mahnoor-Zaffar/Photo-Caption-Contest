import User from "./User.js";
import Image from "./Image.js";
import Caption from "./Caption.js";

User.hasMany(Caption, { foreignKey: "userId", as: "captions" });
Caption.belongsTo(User, { foreignKey: "userId", as: "author" });

Image.hasMany(Caption, { foreignKey: "imageId", as: "captions" });
Caption.belongsTo(Image, { foreignKey: "imageId", as: "image" });

export { User, Image, Caption };
