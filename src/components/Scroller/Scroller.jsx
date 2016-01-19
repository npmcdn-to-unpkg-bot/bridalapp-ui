import log from 'picolog';
import React from 'react';
import ReactDOM from 'react-dom';

export default class Scroller extends React.Component {
	static propTypes = {
		/**
		 * The direction to scroll in, either 'vertical' or 'horizontal'.
		 * Defaults to 'vertical'.
		 */
		direction: React.PropTypes.oneOf(['vertical','horizontal']),

		/**
		 * The items to be scrolled over.
		 * Defaults to `{0:[]}`.
		 *
		 * An object mapping page indexes to arrays of items for those pages
		 * that will be used as the initial data to load into the page buffer.
		 * When paging is not used or only a single page is provided as initial
		 * data, one can supply an array as shorthand for assigning an object
		 * with only page 0 set:
		 *
		 * items = {[{..}, {..}, ..]}
		 *
		 * is equivalent to
		 *
		 * items = {{0: [{..}, {..}, ..]}}
		 */
		items: React.PropTypes.oneOfType([
			React.PropTypes.object,
			React.PropTypes.array,
		]),

		/**
		 * Size of an item in the scroll direction, in pixels.
		 * Defaults to 300.
		 *
		 * For a vertical scroller, set this to the height of each
		 * item, for a horizontal scroller, use the width.
		 */
		itemSize: React.PropTypes.number.isRequired,

		/**
		 * Number of items to be renderer initially, before the component
		 * is mounted.
		 * Defaults to 100.
		 *
		 * This will determine how many items are rendered
		 * during server-side rendering and hence how many items googlebot
		 * will see when visiting the page.
		 */
		initialItemsInView: React.PropTypes.number,

		/**
		 * Number of items shown per row/column.
		 * Defaults to 1.
		 *
		 * For a vertical scroller, set this if there are multiple items per row,
		 * for a horizontal scroller, if there are multiple items per column. You
		 * must ensure that this setting corresponds with the actual situation.
		 * If this setting differs from what is really happening, the scroll
		 * calculations will be off and the behavior will break down.
		 */
		itemsPer: React.PropTypes.number,

		/**
		 * Size of buffer before the first visible item, defaults to 1.
		 * Enables smoother scrolling by pre-rendering some items into a buffer area
		 * just outside the visible viewport, causing images to be pre-loaded.
		 * The number of items rendered before the first visible item will be
		 * the value of this property, multiplied by `itemsPer`.
		 */
		bufferBefore: React.PropTypes.number,

		/**
		 * Size of buffer after the last visible item, defaults to 1.
		 * Enables smoother scrolling by pre-rendering some items into a buffer area
		 * just outside the visible viewport, causing images to be pre-loaded.
		 * The number of items rendered after the last visible item will be
		 * the value of this property, multiplied by `itemsPer`.
		 */
		bufferAfter: React.PropTypes.number,

		/**
		 * Whether to snap items to grid when scrolling comes to an end.
		 *
		 * NOT IMPLEMENTED YET. IMPLEMENTATION SHOULD BE BASED ON CSS Scroll Snap Points
		 * http://www.w3.org/TR/css-snappoints-1/
		 * Backed by a polyfill for non-compliant browsers (many still unfortunately)
		 *
		 * Reason: We want fluid native scrolling on iPhone.
		 */
		snap: React.PropTypes.bool,

		/**
		 * Render function accepting an item and it's index and returning
		 * the markup for that item. This function should accept empty
		 * objects for it's item parameter and return valid markup either way.
		 */
		renderItem: React.PropTypes.func.isRequired, // function(item, index)

		/**
		 * Function accepting an item and it's index and returning
		 * an identifying key for that item. The key is used for technical
		 * purposes. This function should accept null for it's item parameter
		 * and return a valid key either way. If this function is not provided,
		 * the key will default to `'item' + index`.
		 */
		keyForItem: React.PropTypes.func, // function(item, index)

		/**
		 * Function accepting an item and it's index and returning
		 * an identifying slug for that item. The slug is used for
		 * bookmarking etc, so should preferably be human-friendly.
		 * This function should accept null for it's item parameter
		 * and return a valid slug either way. If this function is
		 * not provided, the slug will default to `'item' + index`.
		 */
		slugForItem: React.PropTypes.func, // function(item, index)

		/**
		 * Time, in ms, to capture scroll events before processing them.
		 * Defaults to 10.
		 */
		scrollDebounce: React.PropTypes.number,


		/* PROPERTIES RELATED TO PAGING */

		/**
		 * Total number of items available in the virtual scroller.
		 * Defaults to `items[0].length`;
		 *
		 * When paging is enabled, set this to the total number of
		 * items in the resultset. E.g. for a query with 9,287 results,
		 * set this to 9287.
		 */
		itemCount: React.PropTypes.number,

		/**
		 * The number of items per page.
		 * Defaults to `items[0].length` (just one page with all items).
		 *
		 * When paging is enabled, set this to the number of items per
		 * page. It will be used i.c.w. `itemCount` to determine the
		 * number of pages in the resultset. You can supply more than
		 * one page of data initially by setting `items` to an object
		 * with the data for multiple pages.
		 */
		pageSize: React.PropTypes.number,

		/**
		 * The number of pages to buffer.
		 * Defaults to 5 when `pageSize` is set, otherwise to 1.
		 *
		 * When the user scrolls to pages that are not in the buffer,
		 * `pageFetch` will be called and it's results will be added
		 * to the buffer. When the number of pages exceeds the number
		 * of pages specified by this setting, those pages furthest
		 * away from the user's current scroll position will be removed
		 * from the buffer until this number is no longer exceeded.
		 */
		pageBufferSize: React.PropTypes.number,

		/**
		 * Function that fetches a page of results.
		 *
		 * When paging is enabled, the scroller will call `pageFetch`,
		 * passing it the index of the page to fetch, whenever it needs
		 * the data for a certain page but does not have it. This function
		 * should return a `Promise` that yields an array with the results
		 * for the given page index.
		 *
		 * The scroller will call `renderLoadingItem` when it needs to
		 * render results from a page that has not been fetched yet.
		 */
		pageFetch: React.PropTypes.func, // function(pageIndex)

		/**
		 * Render function accepting an item index and returning markup
		 * indicating that the item is still loading.
		 *
		 * This function is called when paging is enabled and the item to
		 * be rendered is not (yet) available. If this function is not
		 * provided, the system will fall back to calling `renderItem`
		 * and providing an empty object as item parameter.
		 */
		renderLoadingItem: React.PropTypes.func, // function(index)
	};

	static defaultProps = {
		items: {0: []},
		itemSize: 300,
		initialItemsInView: 100,
		itemsPer: 1,
		bufferBefore: 1,
		bufferAfter: 1,
		scrollDebounce: 10,
		direction: 'vertical',
		snap: false,
	};

	constructor(props) {
		super(props); // direction, itemCount, items, itemSize, itemsPer
		this.state = this.getState(props);
		this.onScroll = this.onScroll.bind(this);
	}

	getState(props) {
		let dir = props.direction;
		let initialItemsInView = this.props.initialItemsInView;
		let items = props.items instanceof Array ? {0: props.items} : props.items;
		let itemCount = props.itemCount !== undefined ? props.itemCount : items && items[0] && items[0].length || 0;
		let itemSize = props.itemSize;
		let itemsPer = props.itemsPer;
		let bufferBefore = props.bufferBefore;
		let bufferAfter = props.bufferAfter;
		let containerCount = ~~(itemCount / itemsPer) + (~~(itemCount % itemsPer) ? 1 : 0);

		let scroller = this.mounted ? ReactDOM.findDOMNode(this) : undefined;
		let scrollerSize = scroller ? getSize(dir, scroller) : Math.min(initialItemsInView, containerCount) * itemSize;
		let slider = this.refs.slider;
		let sliderOffset = scroller ? posDifference(dir, slider, scroller) : 0;
		let sliderScroll = scroller ? getScrollPos(dir, scroller) : 0;
		let renderedItems = [];

		let containersBefore = ~~(sliderScroll / itemSize);
		let bufBefore = Math.min(containersBefore, bufferBefore);
		let skippedContainers = containersBefore - bufBefore;
		let skippedItems = skippedContainers * itemsPer;
		let firstIdx = skippedItems;
		let containersInView = ~~(scrollerSize / itemSize) + (~~(scrollerSize % itemSize) ? 1 : 0)
		let lastIdx = Math.min(firstIdx + containersInView * itemsPer + bufferAfter * itemsPer, itemCount - 1);
		for (let i=firstIdx; i<=lastIdx; i++) {
			let item = items[0][i] || null;
			renderedItems.push(item);
		}
		let renderedContainerCount = ~~(renderedItems.length / itemsPer) + (~~(renderedItems.length % itemsPer) ? 1 : 0);
		let sizeBefore = ~~(firstIdx / itemsPer) * itemSize;
		let sizeItems = renderedContainerCount * itemSize;
		let sizeAfter = containerCount * itemSize - sizeBefore - sizeItems;

		return {
			renderedItems: renderedItems,
			firstRenderedItemIndex: firstIdx,
			lastRenderedItemIndex: lastIdx,
			size: scrollerSize,
			sizeBefore: sizeBefore,
			sizeItems: sizeItems,
			sizeAfter: sizeAfter,
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.state.size !== nextState.size) return true;
		if (this.state.sizeBefore !== nextState.sizeBefore) return true;
		if (this.state.sizeAfter !== nextState.sizeAfter) return true;
		if (!arraysEqual(this.state.renderedItems, nextState.renderedItems)) return true;
		return false;
	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getState(nextProps));
	}

	componentWillMount() {
		this.onScrollDebounced = debounce(this.onScroll, this.props.scrollDebounce, false);
	}

	componentDidMount() {
		this.mounted = true;
		this.setState(this.getState(this.props));
		ReactDOM.findDOMNode(this).addEventListener('scroll', this.onScrollDebounced);
	}

	componentWillUnmount() {
		ReactDOM.findDOMNode(this).removeEventListener('scroll', this.onScrollDebounced);
		this.mounted = false;
	}

	onScroll() {
		this.setState(this.getState(this.props));
	}

	render() {
		let slider={}, before={}, items={}, after={}, itm={}, dir = this.props.direction;
		let dim = (dir == 'horizontal' ? 'width' : 'height');
		slider[dim] = this.state.sizeBefore + this.state.sizeItems + this.state.sizeAfter;
		before[dim] = this.state.sizeBefore;
		items[dim] = this.state.sizeItems;
		itm[dim] = this.props.itemSize;
		after[dim] = this.state.sizeAfter;
		return (
			<div className={'Scroller ' + dir + ' per' + this.props.itemsPer}>
				<div className="ScrollSlider" ref="slider" style={slider}
					><div className="ScrollSpacer ScrollSpacerBefore" ref="spacerBefore" style={before}></div
					><div className="ScrollItems" style={items}>{
						this.state.renderedItems.map((item, idx) => {
							idx = idx + this.state.firstRenderedItemIndex;
							let key = this.props.keyForItem ? this.props.keyForItem(item, idx) : 'item' + idx;
							let renderItem = this.props.renderItem;
							if (item === null) {
								if (this.props.renderLoadingItem) {renderItem = this.props.renderLoadingItem;}
								else {item = {};}
							}
							return(
								<div className="ScrollItem" key={key} style={itm}>
									{renderItem(item, idx)}
								</div>
							);
						})
					}</div
					><div className="ScrollSpacer ScrollSpacerAfter" ref="spacerAfter" style={after}></div
				></div
			></div>
		);
	}
}

function arraysEqual(a, b) {
	if (!a || !b) return false;
	if (a.length != b.length) return false;
	for (var i = 0, length = a.length; i < length; i++) {
		if (a[i] != b[i]) return false;
	}
	return true;
}

function posFromWindow(direction, element) {
	var dir = direction === 'horizontal' ? 'Left' : 'Top';
	if (!element || element === window) return 0;
	return element['offset' + dir] + posFromWindow(direction, element.offsetParent);
}

function posDifference(direction, element, container) {
	return posFromWindow(direction, element) - posFromWindow(direction, container);
}

function getSize(direction, element) {
	const dir = direction === 'horizontal' ? 'Width' : 'Height';
	return typeof element['inner' + dir] != 'undefined' ? element['inner' + dir] : element['client' + dir];
}

function getScrollPos(direction, element) {
	var res, axis = 'Y', dir = 'Top';
	if (direction === 'horizontal') {axis = 'X'; dir = 'Left';}
	if (element === window) {
		res = window['page' + axis + 'Offset'];
		if (res == null) res = document.documentElement['scroll' + dir];
		if (res == null) res = document.body['scroll' + dir];
	}
	else {
		res = element['scroll' + axis];
		if (res == null) res = element['scroll' + dir];
	}
	return (res == null) ? 0 : res;
}

function debounce(func, wait, immediate) {
	if (!wait) return func;
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;

			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}