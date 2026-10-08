import { article } from "./article";
import { author } from "./author";
import { breakingNews } from "./breakingNews";
import { contactInfo } from "./contactInfo";
import { graphic, photoAlbum, poll } from "./media";
import { privacyPolicy, termsOfUse } from "./policyPages";
import { story } from "./story";

export const schemaTypes = [article, story, author, photoAlbum, graphic, poll, contactInfo, privacyPolicy, termsOfUse, breakingNews];
