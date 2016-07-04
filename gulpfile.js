/// <binding BeforeBuild='build, remove-gz-files' />
// ReSharper disable PossiblyUnassignedProperty
var gulp = require("gulp"),
    browserSync = require('browser-sync').create(),
    sourcemaps = require("gulp-sourcemaps"),
    typescript = require('typescript'),
    gulpIf = require('gulp-if'),
    sass = require('gulp-sass'),
    Builder = require('systemjs-builder'),
    gutil = require('gulp-util'),
    ts = require("gulp-typescript");

var docRootDir = ".",
    typeScriptFiles = "./app/**/*.ts",

    tsProject = ts.createProject("./tsconfig.json", {
        typescript: typescript
    }),
    browserFiles = ["./dist/**/*", "./*.html", "./css/**/*"],
    sassFiles = './sass/**/*ss',
    cssFiles = './css',
    appEntry = 'js/app/main.js',
    appBundleTarget = 'dist/app.bundle.min.js';

var isProductionMode = gutil.env.production;

/**
 * Erstellt einen Server furch Browser-Sync
 */
gulp.task('connect', function () {
    var serverOptions = {
        reloadOnRestart: true,
        reloadDebounce: 500,
        logLevel: "warning",
        notify: false,
        server: {
            baseDir: ".",
            port: 3000,
            open: "local"
        }
    };
    browserSync.init(serverOptions);
});

/**
 * Übersetzt Sass
 */
gulp.task('sass', function () {
    return gulp.src(sassFiles)
        .pipe(sass({
            outputStyle: isProductionMode ? 'compressed' : 'nested'
        }).on('error', sass.logError))
        .pipe(gulp.dest(cssFiles));
});


/**
 * Kompiliert Typescript-Dateien
 */
gulp.task("tsc", function () {
    var tsResult = gulp.src(typeScriptFiles, {base: "."})
        .pipe(gulpIf(!isProductionMode, sourcemaps.init()))
        .pipe(ts(tsProject));
    return tsResult.js
        .pipe(gulpIf(!isProductionMode, sourcemaps.write(".")))
        .pipe(gulp.dest(docRootDir+"/js/"));
});


/**
 * Bündelt die App-Dateien
 */
gulp.task("bundle-app", ["tsc"], function () {
    var builder = new Builder();
    builder.config({
        defaultJSExtensions: true
    });
    builder
        .buildStatic(appEntry, appBundleTarget, {
            minify: isProductionMode,
            sourceMaps: !isProductionMode,
            lowResSourceMaps: true,
            mangle: isProductionMode
        })
        .then(function () {
            gutil.log('Build complete');
        })
        .catch(function (err) {
            console.log(err);
        });
    return gulp.src(appBundleTarget);
});


/**
 * Startet Watcher
 */
gulp.task("watch", ["connect"], function () {
    gulp.watch(typeScriptFiles, ["bundle-app"]);
    gulp.watch(browserFiles).on("change", browserSync.reload);
    gulp.watch(sassFiles, ['sass']);
});


gulp.task("default", ['sass', 'bundle-app'], function (callback) {
    if (!isProductionMode) {
        console.log("\n -----\n Bitte verwenden Sie `gulp --production` für den produktiven Build\n -----");
    }


});