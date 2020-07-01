//  @ts-nocheck

import React, { Component } from 'react';
import Spinner from 'react-spinner';
import classNames from 'classnames';


import logo from './logo.svg';
import './App.css';

const AccCore = require('opentok-accelerator-core/dist/core');

let otCore;

const containerClasses = (state) => {
    const { active, meta, localAudioEnabled, localVideoEnabled } = state;
    const sharingScreen = meta ? !!meta.publisher.screen : false;
    const viewingSharedScreen = meta ? meta.subscriber.screen : false;
    const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;
    const activeCameraSubscribersGt2 = activeCameraSubscribers > 2;
    const activeCameraSubscribersOdd = activeCameraSubscribers % 2;
    const screenshareActive = viewingSharedScreen || sharingScreen;
    return {
        controlClass: classNames('App-control-container', { hidden: !active }),
        localAudioClass: classNames('ots-video-control circle audio', { hidden: !active, muted: !localAudioEnabled }),
        localVideoClass: classNames('ots-video-control circle video', { hidden: !active, muted: !localVideoEnabled }),
        localCallClass: classNames('ots-video-control circle end-call', { hidden: !active }),
        cameraPublisherClass: classNames('video-container', { hidden: !active, small: !!activeCameraSubscribers || screenshareActive, left: screenshareActive }),
        screenPublisherClass: classNames('video-container', { hidden: !active || !sharingScreen }),
        cameraSubscriberClass: classNames('video-container', { hidden: !active || !activeCameraSubscribers },
            { 'active-gt2': activeCameraSubscribersGt2 && !screenshareActive },
            { 'active-odd': activeCameraSubscribersOdd && !screenshareActive },
            { small: screenshareActive }
        ),
        screenSubscriberClass: classNames('video-container', { hidden: !viewingSharedScreen || !active }),
    };
};

const connectingMask = () =>
    <div className="App-mask">
        <Spinner />
        <div className="message with-spinner">Connecting</div>
    </div>;

const startCallMask = start =>
    <div className="App-mask">
        <button className="message button clickable" onClick={start}>Click to Start Call </button>
    </div>;

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connected: false,
            active: false,
            publishers: null,
            subscribers: null,
            meta: null,
            localAudioEnabled: true,
            localVideoEnabled: true,
        };
        this.startCall = this.startCall.bind(this);
        this.endCall = this.endCall.bind(this);
        this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
        this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
    }

    componentDidMount() {
        const urlParams = new URLSearchParams(window.location.search);
        const apiKey = urlParams.get('apiKey');
        const sessionId = urlParams.get('sessionId');
        const token = urlParams.get('token');

        const otCoreOptions = {
            credentials: { apiKey, sessionId, token },
            streamContainers(pubSub, type, data, stream) {
                return {
                    publisher: {
                        camera: '#cameraPublisherContainer',
                        screen: '#screenPublisherContainer',
                    },
                    subscriber: {
                        camera: '#cameraSubscriberContainer',
                        screen: '#screenSubscriberContainer',
                    },
                }[pubSub][type];
            },
            controlsContainer: '#controls',
        };

        otCore = new AccCore(otCoreOptions);

        otCore.connect().then(() => this.setState({ connected: true }));

        const events = [
            'subscribeToCamera',
            'unsubscribeFromCamera',
            'subscribeToScreen',
            'unsubscribeFromScreen',
            'startScreenShare',
            'endScreenShare',
        ];

        events.forEach(event => otCore.on(event, ({ publishers, subscribers, meta }) => {
            this.setState({ publishers, subscribers, meta });
        }));
    }

    startCall() {
        otCore.startCall()
            .then(({ publishers, subscribers, meta }) => {
                this.setState({ publishers, subscribers, meta, active: true });
            }).catch(error => console.log(error));
    }

    endCall() {
        otCore.endCall();
        this.setState({ active: false });
    }

    toggleLocalAudio() {
        otCore.toggleLocalAudio(!this.state.localAudioEnabled);
        this.setState({ localAudioEnabled: !this.state.localAudioEnabled });
    }

    toggleLocalVideo() {
        otCore.toggleLocalVideo(!this.state.localVideoEnabled);
        this.setState({ localVideoEnabled: !this.state.localVideoEnabled });
    }

    render() {
        const { connected, active } = this.state;
        const {
            localAudioClass,
            localVideoClass,
            localCallClass,
            controlClass,
            cameraPublisherClass,
            screenPublisherClass,
            cameraSubscriberClass,
            screenSubscriberClass,
        } = containerClasses(this.state);

        return (
            <div className="App">
                <div className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1>OpenTok Accelerator Core</h1>
                </div>
                <div className="App-main">
                    <div className="App-video-container">
                        { !connected && connectingMask() }
                        { connected && !active && startCallMask(this.startCall)}
                        <div id="cameraPublisherContainer" className={cameraPublisherClass} />
                        <div id="screenPublisherContainer" className={screenPublisherClass} />
                        <div id="cameraSubscriberContainer" className={cameraSubscriberClass} />
                        <div id="screenSubscriberContainer" className={screenSubscriberClass} />
                    </div>
                    <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
                        <div id="controls" className={controlClass}>
                            <div className={localAudioClass} onClick={this.toggleLocalAudio} />
                            <div className={localVideoClass} onClick={this.toggleLocalVideo} />
                            <div className={localCallClass} onClick={this.endCall} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
