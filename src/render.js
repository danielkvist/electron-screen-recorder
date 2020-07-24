const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;

const video = document.getElementById('video');
const selectBtn = document.getElementById('select');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');

let mediaRecorder;
const recordedChunks = [];

const handleDataAvailable = (e) => {
	console.log('video data available');
	recordedChunks.push(e.data);
};

const handleStop = async (e) => {
	const blob = new Blob(recordedChunks, {
		type: 'video/webm; codecs=vp9',
	});
	const buffer = await Buffer.from(await blob.arrayBuffer());
	const { filePath } = await dialog.showSaveDialog({
		buttonLabel: 'Save video',
		defaultPath: `video-${Date.now()}.webm`,
	});

	console.log(filePath);
	writeFile(filePath, buffer, () => console.log('video saved successfully!'));
};

const selectSource = async (source) => {
	selectBtn.innerText = source.name;

	const constraints = {
		audio: false,
		video: {
			mandatory: {
				chromeMediaSource: 'desktop',
				chromeMediaSourceId: source.id,
			},
		},
	};

	const stream = await navigator.mediaDevices.getUserMedia(constraints);

	video.srcObject = stream;
	video.play();

	const options = { mimeType: 'video/webm; codecs=vp9' };
	mediaRecorder = new MediaRecorder(stream, options);

	mediaRecorder.ondataavailable = handleDataAvailable;
	mediaRecorder.onstop = handleStop;
};

const getVideoSources = async () => {
	const inputSources = await desktopCapturer.getSources({
		types: ['window', 'screen'],
	});

	const videoOptionsMenu = Menu.buildFromTemplate(
		inputSources.map((s) => {
			return {
				label: s.name,
				click: () => selectSource(s),
			};
		})
	);

	videoOptionsMenu.popup();
};

startBtn.onclick = (e) => {
	mediaRecorder.start();
	startBtn.innerText = 'Recording';
};

stopBtn.onclick = (e) => {
	mediaRecorder.stop();
	startBtn.innerText = 'Start';
};

selectBtn.onclick = getVideoSources;
