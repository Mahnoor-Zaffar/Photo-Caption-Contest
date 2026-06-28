import User from "./User.js";
import Image from "./Image.js";
import Caption from "./Caption.js";
import Vote from "./Vote.js";

User.hasMany(Caption, { foreignKey: "userId", as: "captions" });
Caption.belongsTo(User, { foreignKey: "userId", as: "author" });

Image.hasMany(Caption, { foreignKey: "imageId", as: "captions" });
Caption.belongsTo(Image, { foreignKey: "imageId", as: "image" });

User.hasMany(Vote, { foreignKey: "userId", as: "votes" });
Vote.belongsTo(User, { foreignKey: "userId", as: "voter" });

Caption.hasMany(Vote, { foreignKey: "captionId", as: "votes" });
Vote.belongsTo(Caption, { foreignKey: "captionId", as: "caption" });

export { User, Image, Caption, Vote };
