import { article } from "./article";
import { author } from "./author";
import { contactInfo } from "./contactInfo";
import { graphic, photoAlbum, poll } from "./media";
import { story } from "./story";

export const schemaTypes = [article, story, author, photoAlbum, graphic, poll, contactInfo];
