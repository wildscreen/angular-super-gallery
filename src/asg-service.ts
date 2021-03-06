///<reference path="./../typings/index.d.ts" />

namespace ASG {

	// modal component options
	export interface IOptionsModal {

		menu? : boolean;
		help? : boolean;
		caption? : boolean;
		transition? : string;
		title? : string;
		subtitle? : string;
		size? : string;
		keycodes? : {
			exit? : Array<number>;
			playpause? : Array<number>;
			forward? : Array<number>;
			backward? : Array<number>;
			first? : Array<number>;
			last? : Array<number>;
			fullscreen? : Array<number>;
			menu? : Array<number>;
			caption? : Array<number>;
			help? : Array<number>;
			size? : Array<number>;
			transition? : Array<number>;
		};
	}

	// panel component options
	export interface IOptionsPanel {

		visible? : boolean;
		item? : {
			class? : string;
			caption : boolean;
		};

	}

	// info component options
	export interface IOptionsInfo {

	}

	// image component options
	export interface IOptionsImage {

		transition? : string;
		size? : string;
		height? : number;
		heightMin? : number;
		heightAuto? : {
			initial? : boolean,
			onresize? : boolean
		};

	}

	// gallery options
	export interface IOptions {

		debug? : boolean;
		baseUrl? : string;
		fields? : {
			source? : {
				modal? : string;
				panel? : string;
				image? : string;
			}
			title? : string;
			description? : string;
			thumbnail? : string;
		};
		autoplay? : {
			enabled? : boolean;
			delay? : number;
		};
		theme? : string;
		preloadDelay? : number;
		preload? : Array<number>;
		modal? : IOptionsModal;
		panel? : IOptionsPanel;
		image? : IOptionsImage;

	}

	// image source
	export interface ISource {

		modal : string; // original, required
		panel? : string;
		image? : string;

	}

	// image file
	export interface IFile {

		source : ISource;
		title? : string;
		name? : string;
		extension? : string;
		description? : string;
		download? : string;
		loaded? : {
			modal? : boolean;
			panel? : boolean;
			image? : boolean;
		};
		width? : number;
		height? : number;

	}

	// service controller interface
	export interface IServiceController {

		modalVisible : boolean;
		panelVisible : boolean;
		modalAvailable : boolean;
		transitions : Array<string>;
		themes : Array<string>;
		options : IOptions;
		items : Array<IFile>;
		selected : number;
		file : IFile;
		sizes : Array<string>;
		events : {
			CONFIG_LOAD : string;
			AUTOPLAY_START : string;
			AUTOPLAY_STOP : string;
			PARSE_IMAGES : string;
			LOAD_IMAGE : string;
			FIRST_IMAGE : string;
			CHANGE_IMAGE : string;
			MODAL_OPEN : string;
			MODAL_CLOSE : string;
		};

		getInstance(component : any) : IServiceController;

		setDefaults() : void;

		setOptions(options : IOptions) : IOptions;

		setItems(items : Array<IFile>) : void;

		preload(wait? : number) : void;

		normalize(index : number) : number;

		setFocus() : void;

		modalOpen(index : number) : void;

		modalClose() : void;

		toBackward(stop? : boolean) : void;

		toForward(stop? : boolean) : void;

		toFirst(stop? : boolean) : void;

		toLast(stop? : boolean) : void;

		loadImage(index? : number) : void;

		loadImages(indexes : Array<number>) : void;

		autoPlayToggle() : void;

		toggle(element : string) : void;

		setHash() : void;

		downloadLink() : string;

		log(event : string, data? : any) : void;


	}

	// service controller
	export class ServiceController {

		public slug = 'asg';
		public id : string;
		public items : any;
		public files : Array<IFile> = [];
		public direction : string;
		public modalAvailable = false;

		private instances : {} = {};
		private _selected : number;
		private _visible = false;
		private autoplay : angular.IPromise<any>;
		private first = false;

		public options : IOptions = null;
		public optionsLoaded = false;


		public defaults : IOptions = {
			debug: false, // image load and autoplay info in console.log
			baseUrl: '', // url prefix
			fields: {
				source: {
					modal: 'url', // required, image url for modal component (large size)
					panel: 'url', // image url for panel component (thumbnail size)
					image: 'url' // image url for image (medium size)
				},
				title: 'title', // title input field name
				description: 'description', // description input field name
				thumbnail: 'thumbnail' // thumbnail input field name
			},
			autoplay: {
				enabled: false, // slideshow play enabled/disabled
				delay: 4100 // autoplay delay in millisecond
			},
			theme: 'default', // css style [default, darkblue, whitegold]
			preloadDelay: 770,
			preload: [], // preload images by index number
			modal: {
				title: '', // modal window title
				subtitle: '', // modal window subtitle
				caption: true, // show/hide image caption
				menu: true, // show/hide modal menu
				help: false, // show/hide help
				transition: 'slideLR', // transition effect
				size: 'cover', // contain, cover, auto, stretch
				keycodes: {
					exit: [27], // esc
					playpause: [80], // p
					forward: [32, 39], // space, right arrow
					backward: [37], // left arrow
					first: [38, 36], // up arrow, home
					last: [40, 35], // down arrow, end
					fullscreen: [13], // enter
					menu: [77], // m
					caption: [67], // c
					help: [72], // h
					size: [83], // s
					transition: [84] // t
				}
			},
			panel: {
				visible: true,
				item: {
					class: 'col-md-3', // item class
					caption: false
				},
			},
			image: {
				transition: 'slideLR', // transition effect
				size: 'cover', // contain, cover, auto, stretch
				height: 0, // height
				heightMin: 0, // min height
				heightAuto: {
					initial: true,
					onresize: false
				}
			}
		};

		// available image sizes
		public sizes : Array<string> = [
			'contain',
			'cover',
			'auto',
			'stretch'
		];

		// available themes
		public themes : Array<string> = [
			'default',
			'darkblue',
			'whitegold'
		];

		// available transitions
		public transitions : Array<string> = [
			'no',
			'fadeInOut',
			'zoomIn',
			'zoomOut',
			'zoomInOut',
			'rotateLR',
			'rotateTB',
			'rotateZY',
			'slideLR',
			'slideTB',
			'flipX',
			'flipY'
		];

		public events = {
			CONFIG_LOAD: 'ASG-config-load-',
			AUTOPLAY_START: 'ASG-autoplay-start-',
			AUTOPLAY_STOP: 'ASG-autoplay-stop-',
			PARSE_IMAGES: 'ASG-parse-images-',
			LOAD_IMAGE: 'ASG-load-image-',
			FIRST_IMAGE: 'ASG-first-image-',
			CHANGE_IMAGE: 'ASG-change-image-',
			MODAL_OPEN: 'ASG-modal-open-',
			MODAL_CLOSE: 'ASG-modal-close-',
		};

		constructor(private timeout : ng.ITimeoutService,
					private interval : ng.IIntervalService,
					private location : ng.ILocationService,
					private $rootScope : ng.IRootScopeService) {

		}

		private parseHash() {

			if (!this.id) {
				return;
			}

			let hash = this.location.hash();
			let parts = hash ? hash.split('-') : null;

			if (parts === null) {
				return;
			}

			if (parts[0] !== this.slug) {
				return;
			}

			if (parts.length !== 3) {
				return;
			}

			if (parts[1] !== this.id) {
				return;
			}

			let index = parseInt(parts[2], 10);

			if (!angular.isNumber(index)) {
				return;
			}

			this.timeout(() => {

				index--;
				this.selected = index;
				this.modalOpen(index);

			}, 20);

		}

		// calculate object hash id
		public objectHashId(object : any) : string {

			let string = JSON.stringify(object);
			let abc = string.replace(/[^a-zA-Z0-9]+/g, '');
			let code = 0;

			for (let i = 0, n = abc.length; i < n; i++) {
				let charcode = abc.charCodeAt(i);
				code += (charcode * i);
			}

			return code.toString(21);

		}

		// get service instance for current gallery by component id
		public getInstance(component : any) {

			if (!component.id) {

				// get parent asg component id
				if (component.$scope && component.$scope.$parent && component.$scope.$parent.$parent && component.$scope.$parent.$parent.$ctrl) {
					component.id = component.$scope.$parent.$parent.$ctrl.id;
				} else {
					component.id = this.objectHashId(component.options);
				}

			}

			const id = component.id;
			let instance = this.instances[id];

			// new instance and set options and items
			if (instance === undefined) {
				instance = new ServiceController(this.timeout, this.interval, this.location, this.$rootScope);
				instance.id = id;
			}

			instance.setOptions(component.options);
			instance.setItems(component.items);
			instance.selected = component.selected ? component.selected : 0;
			instance.parseHash();

			if (instance.options) {

				instance.loadImages(instance.options.preload);

				if (instance.options.autoplay && instance.options.autoplay.enabled && !instance.autoplay) {
					instance.autoPlayStart();
				}

			}

			this.instances[id] = instance;
			return instance;

		}

		// prepare images array
		public setItems(items : Array<IFile>) {

			if (!items) {
				return;
			}

			// if already
			if (this.items) {
				return;
			}

			// parse array string elements
			if (angular.isString(items[0]) === true) {

				this.items = [];
				for (let i = 0; i < items.length; i++) {
					this.items.push({source: {modal: items[i]}});
				}

			} else {

				this.items = items;

			}

			this.prepareItems();

		}

		// options setup
		public setOptions(options : IOptions) {

			// if options already setup
			if (this.optionsLoaded) {
				return;
			}

			if (options) {
				this.options = angular.merge(this.defaults, options);
				this.optionsLoaded = true;
			} else {
				this.options = this.defaults;
			}

			// important!
			options = this.options;

			this.event(this.events.CONFIG_LOAD, this.options);

			return this.options;

		}

		// set selected image
		public set selected(v : number) {

			v = this.normalize(v);

			if (v !== this._selected) {
				this.event(this.events.CHANGE_IMAGE, {index: v, file: this.file});
			}

			this._selected = v;
			this.preload();

		}

		// get selected image
		public get selected() {

			return this._selected;

		}


		public setSelected(index : number) {

			this.autoPlayStop();
			this.direction = index > this.selected ? 'forward' : 'backward';
			this.selected = index;

		}


		// go to backward
		public toBackward(stop? : boolean, $event? : UIEvent) {

			if ($event) {
				$event.stopPropagation();
			}

			if (stop) {
				this.autoPlayStop();
			}

			this.direction = 'backward';
			this.selected--;
			this.loadImage(this.selected - 1);
			this.setHash();
			this.setFocus();

		}

		// go to forward
		public toForward(stop? : boolean, $event? : UIEvent) {

			if ($event) {
				$event.stopPropagation();
			}

			if (stop) {
				this.autoPlayStop();
			}

			this.direction = 'forward';
			this.selected++;
			this.loadImage(this.selected + 1);
			this.setHash();
			this.setFocus();

		}

		// go to first
		public toFirst(stop? : boolean) {

			if (stop) {
				this.autoPlayStop();
			}

			this.direction = 'backward';
			this.selected = 0;
			this.setHash();

		}

		// go to last
		public toLast(stop? : boolean) {

			if (stop) {
				this.autoPlayStop();
			}

			this.direction = 'forward';
			this.selected = this.items.length - 1;
			this.setHash();

		}

		public setHash() {

			if (this.modalVisible) {
				this.location.hash([this.slug, this.id, this.selected + 1].join('-'));
			}

		}

		public autoPlayToggle() {

			if (this.options.autoplay.enabled) {
				this.autoPlayStop();
			} else {
				this.autoPlayStart();
			}

		}


		public autoPlayStop() {

			if (!this.autoplay) {
				return;
			}

			this.interval.cancel(this.autoplay);
			this.options.autoplay.enabled = false;
			this.autoplay = null;
			this.event(this.events.AUTOPLAY_STOP, {index: this.selected, file: this.file});

		}

		public autoPlayStart() {

			if (this.autoplay) {
				return;
			}

			this.options.autoplay.enabled = true;
			this.autoplay = this.interval(() => {
				this.toForward();
			}, this.options.autoplay.delay);

			this.event(this.events.AUTOPLAY_START, {index: this.selected, file: this.file});

		}


		private prepareItems() {

			const self = this;

			let getAvailableSource = function (type : string, source : ISource) {

				if (source[type]) {
					return source[type];
				}

				if (type === 'panel') {
					return getAvailableSource('image', source);
				}

				if (type === 'image') {
					return getAvailableSource('modal', source);
				}

				if (type === 'modal') {
					return getAvailableSource('image', source);
				}

			};


			angular.forEach(this.items, function (value, key) {

				if (!value.source) {

					value.source = {
						modal: value[self.options.fields.source.modal],
						panel: value[self.options.fields.source.panel],
						image: value[self.options.fields.source.image],
					};

				}

				let source = {
					modal: self.options.baseUrl + getAvailableSource('modal', value.source),
					panel: self.options.baseUrl + getAvailableSource('panel', value.source),
					image: self.options.baseUrl + getAvailableSource('image', value.source),
				};


				let parts = source.modal.split('/');
				let filename = parts[parts.length - 1];

				let title, description;

				if (self.options.fields !== undefined) {
					title = value[self.options.fields.title] ? value[self.options.fields.title] : filename;
				} else {
					title = filename;
				}

				if (self.options.fields !== undefined) {
					description = value[self.options.fields.description] ? value[self.options.fields.description] : null;
				} else {
					description = null;
				}

				let file = {
					source: source,
					title: title,
					description: description,
					loaded: {
						modal: false,
						panel: false,
						image: false
					}
				};

				self.files.push(file);

			});

			this.event(this.events.PARSE_IMAGES, this.files);

		}


		public hoverPreload(index : number) {

			this.loadImage(index);

		}


		// image preload
		private preload(wait? : number) {

			this.loadImage(this.selected);

			this.timeout(() => {
				this.loadImage(this.selected + 1);
			}, (wait !== undefined) ? wait : this.options.preloadDelay);

		}

		public normalize(index : number) {

			let last = this.files.length - 1;

			if (index > last) {
				return (index - last) - 1;
			}

			if (index < 0) {
				return last - Math.abs(index) + 1;
			}

			return index;

		}


		public loadImages(indexes : Array<number>, type : string) {

			if (!indexes) {
				return;
			}

			let self = this;

			indexes.forEach((index : number) => {
				self.loadImage(index);
			});

		}


		public loadImage(index? : number, callback? : {}) {

			index = index ? index : this.selected;
			index = this.normalize(index);

			if (!this.files[index]) {
				this.log('invalid file index', {index: index});
				return;
			}

			if (this.files[index].loaded.modal) {
				return;
			}

			let image = new Image();
			image.src = this.files[index].source.image;
			image.addEventListener('load', () => {
				this.afterLoad(index, 'image', image);
			});

			let modal = new Image();
			modal.src = this.files[index].source.modal;
			modal.addEventListener('load', (event) => {
				this.afterLoad(index, 'modal', modal);
			});

		}

		// get file name
		private getFilename(index : number, type? : string) {

			type = type ? type : 'modal';
			let fileparts = this.files[index].source[type].split('/');
			let filename = fileparts[fileparts.length - 1];
			return filename;

		}

		// get file extension
		private getExtension(index : number, type? : string) {

			type = type ? type : 'modal';
			let fileparts = this.files[index].source[type].split('.');
			let extension = fileparts[fileparts.length - 1];
			return extension;

		}

		// after load image
		private afterLoad(index, type, image) {

			if (this.files[index].loaded[type] === true) {
				return;
			}

			this.files[index].loaded[type] = true;

			if (type === 'modal') {
				this.files[index].width = image.width;
				this.files[index].height = image.height;
				this.files[index].name = this.getFilename(index, type);
				this.files[index].extension = this.getExtension(index, type);
				this.files[index].download = this.files[index].source.modal;
			}

			let data = {type: type, index: index, file: this.file, img: image};

			if (!this.first) {
				this.first = true;
				this.event(this.events.FIRST_IMAGE, data);
			}

			this.event(this.events.LOAD_IMAGE, data);

		}


		// is single?
		public get isSingle() {

			return this.files.length > 1 ? false : true;

		}


		// get the download link
		public downloadLink() {

			if (this.selected !== undefined && this.files.length > 0) {
				return this.files[this.selected].source.modal;
			}

		}


		// get the file
		public get file() {

			return this.files[this.selected];

		}

		// toggle element visible
		public toggle(element : string) {

			this.options[element].visible = !this.options[element].visible;

		}


		// get visible
		public get modalVisible() {

			return this._visible;

		}


		// get theme
		public get theme() {

			return this.options.theme;

		}


		// set visible
		public set modalVisible(value : boolean) {

			this._visible = value;

			if (value) {

				this.preload(1);
				this.modalInit();
				this.el('body').addClass('yhidden');

			} else {

				this.el('body').removeClass('yhidden');

			}

		}

		// set the focus
		public setFocus() {

			this.el('.asg-modal.' + this.id + ' .keyInput').trigger('focus').focus();

		}


		// initialize the gallery
		private modalInit() {

			let self = this;

			this.timeout(() => {

				// submenu click events
				let element = '.gallery-modal.' + self.id + ' li.dropdown-submenu';

				this.el(element).off().on('click', function (event) {

					event.stopPropagation();

					if (this.el(this).hasClass('open')) {
						this.el(this).removeClass('open');
					} else {
						this.el(element).removeClass('open');
						this.el(this).addClass('open');
					}

				});

				self.setFocus();

			}, 100);

		}


		public modalOpen(index : number) {

			if (!this.modalAvailable) {
				return;
			}

			this.selected = index ? index : this.selected;
			this.modalVisible = true;
			this.setHash();
			this.event(this.events.MODAL_OPEN, {index: this.selected});

		}

		public modalClose() {

			this.location.hash('');
			this.modalVisible = false;
			this.event(this.events.MODAL_CLOSE, {index: this.selected});

		}


		private event(event : string, data? : any) {

			event = event + this.id;
			this.$rootScope.$emit(event, data);
			this.log(event, data);

		}

		public log(event : string, data? : any) {

			if (this.options.debug) {
				console.log(event, data ? data : null);
			}

		}

		private el(selector) : any {

			return angular.element(selector);

		}


	}

	let app : ng.IModule = angular.module('angularSuperGallery');

	app.service('asgService', ['$timeout', '$interval', '$location', '$rootScope', ServiceController]);

}

