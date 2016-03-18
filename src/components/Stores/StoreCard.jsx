﻿import React, { Component, PropTypes } from 'react';
const { any, bool, string, object, shape } = PropTypes;
import classNames from 'classnames';
import { CardTitle, CardText } from 'react-mdl';
import Suid from 'ws.suid';
import { StatefulFlipCard, FrontFace, BackFace } from '../Mdl/mdl-extras';

export class StoreCard extends Component {
	static propTypes = {
		store: shape({
			id: any,
			name: string,
			description: string,
			address1: string,
			address2: string,
			postalCode: string,
			city: string,
			state: string,
			countryCode: string,
			telephone: string,
			website: string,
			email: string,
			premium: bool.isRequired,
		}).isRequired,
	};

	constructor(...props) {
		super(...props);
		this.state = {logoMissing:false, thumbMissing:false};
	}

	render() {
		const { store: { id, name, description, address1, address2, postalCode, city, state, countryCode, telephone, website, premium, published } } = this.props;
		const sid = Suid(id).toString();
		const logo = `https://cdn.rawgit.com/Download/bridalapp-static/1.0.4/stores/${sid}/logo.png`;
		const thumb = `https://cdn.rawgit.com/Download/bridalapp-static/1.0.4/stores/${sid}/thumb.jpg`;
		const style = true ? {} : {'-webkit-filter':'grayscale(1)', filter:'grayscale(1)'};
		const classes = classNames('Store', {'premium':premium, 'unpublished':!published});
		// src="data:image/gif;base64,R0lGODlhAwABAIAAAP///////yH5BAEKAAEALAAAAAADAAEAAAICjAsAOw=="
		return (
			<StatefulFlipCard className={classes} key={sid}>
				<FrontFace>
					<CardTitle>
						{this.state.logoMissing ?
							<h3 className="StoreLogoAlt">{name}</h3>
						:
							<img style={style} className="StoreLogo" src={logo}
								onError={()=>this.setState({...this.state, logoMissing:true})} />
						}
					</CardTitle>
					<div className="mdl-card__content">
						{! this.state.thumbMissing ?
							<img style={style} className="StoreThumb" src={thumb}
								onError={()=>this.setState({...this.state, thumbMissing:true})} />
						:
							<div style={{height:150}}></div>
						}

						<CardText className="StoreDescription">
							{description}
						</CardText>
					</div>
				</FrontFace>
				<BackFace>
					<CardTitle>
						{this.state.logoMissing ?
							<h3 className="StoreLogoAlt">{name}</h3>
						:
							<img style={{filter:'grayscale(1)'}} className="StoreLogo" src={logo} onError={()=>this.setState({...this.state, logoMissing:true})} />
						}
					</CardTitle>
					<p>{description}</p>
					<address>
						{address1}<br/>
						{address2}<br/>
						{city}
					</address>
				</BackFace>
			</StatefulFlipCard>
		);
	}
}
export default StoreCard;