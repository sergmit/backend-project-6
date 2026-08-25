// @ts-check

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifySensible from '@fastify/sensible';
import getHelpers from './helpers/index.js';
import { plugin as fastifyReverseRoutes } from 'fastify-reverse-routes';
import Pug from 'pug';
// @ts-expect-error
import addRoutes from './routes/index.js';


const __dirname = fileURLToPath(path.dirname(import.meta.url));

const mode = process.env.NODE_ENV || 'development';
// const isDevelopment = mode === 'development';

const setUpViews = (app) => {
    const helpers = getHelpers(app);
    app.register(fastifyView, {
        engine: {
            pug: Pug,
        },
        includeViewExtension: true,
        defaultContext: {
            ...helpers,
            assetPath: (filename) => `/assets/${filename}`,
        },
        templates: path.join(__dirname, '..', 'server', 'views'),
    });

    app.decorateReply('render', function render(viewPath, locals) {
        this.view(viewPath, { ...locals, reply: this });
    });
};

const setUpStaticAssets = (app) => {
    const pathPublic = path.join(__dirname, '..', 'dist');
    app.register(fastifyStatic, {
        root: pathPublic,
        prefix: '/assets/',
    });
};

const registerPlugins = async (app) => {
    await app.register(fastifySensible);
    // await app.register(fastifyErrorPage);
    await app.register(fastifyReverseRoutes);


};

export const options = {
    exposeHeadRoutes: false,
};

export default async (app, _options) => {
    await registerPlugins(app);

    setUpViews(app);
    setUpStaticAssets(app);
    addRoutes(app);

    return app;
};