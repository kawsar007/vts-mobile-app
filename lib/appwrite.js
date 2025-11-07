import { Client, Account, Avatars } from "react-native-appwrite";

export const client = new Client()
    .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setPlatform('dev.kawsar.com');
    // .setKey(process.env.API_KEY)
    // .setTemplateEngine(new HandlebarsTemplateEngine());

    export const account = new Account(client);
    export const avatars = new Avatars(client);