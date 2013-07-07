// MIDIFileHeader : Read and edit a MIDI header chunk in a given ArrayBuffer

// AMD + global : You can use this object by inserting a script
// or using an AMD loader (like RequireJS) or using NodeJS
(function(root,define){ define([], function() {

	function MIDIFileHeader(buffer, strictMode) {
		if(!(buffer instanceof ArrayBuffer))
				throw Error('Invalid buffer received.');
		this.datas=new DataView(buffer,0,14);
		// Reading MIDI header chunk
		if(!('M'===String.fromCharCode(this.datas.getUint8(0))
			&&'T'===String.fromCharCode(this.datas.getUint8(1))
			&&'h'===String.fromCharCode(this.datas.getUint8(2))
			&&'d'===String.fromCharCode(this.datas.getUint8(3))))
			throw new Error('Invalid MIDIFileHeader : MThd prefix not found');
		// Reading chunk length
		if(6!==this.datas.getUint32(4))
			throw new Error('Invalid MIDIFileHeader : Chunk length must be 6');
	}

	// Static constants
	MIDIFileHeader.FRAMES_PER_SECONDS=1;
	MIDIFileHeader.TICKS_PER_BEAT=2;

	// MIDI file format
	MIDIFileHeader.prototype.getFormat=function() {
		var format=this.datas.getUint16(8);
		if(0!==format&&1!==format&&2!==format)
			throw new Error('Invalid MIDI file : MIDI format ('+format+'),'
				+' format can be 0, 1 or 2 only.');
		return format;
	};

	MIDIFileHeader.prototype.setFormat=function(format) {
		var format=this.datas.getUint16(8);
		if(0!==format&&1!==format&&2!==format)
			throw new Error('Invalid MIDI format given ('+format+'),'
				+' format can be 0, 1 or 2 only.');
		return format;
	};

	// Number of tracks
	MIDIFileHeader.prototype.getTracksCount=function() {
		return this.datas.getUint16(10);
	};

	MIDIFileHeader.prototype.setTracksCount=function(n) {
		return this.datas.setUint16(10,n);
	};

	// Tick compute
	MIDIFileHeader.prototype.getTickResolution=function(tempo) {
		// Frames per seconds
		if(this.datas.getUint16(12)&0x8000) {
			return 1000000/(this.getSMPTEFrames() * this.getTicksPerFrame());
		// Ticks per beat
		} else {
			// Default MIDI tempo is 120bpm, 500ms per beat
			tempo=tempo||500;
			return tempo/this.getTicksPerBeat();
		}
	};

	// Time division type
	MIDIFileHeader.prototype.getTimeDivision=function() {
		if(this.datas.getUint16(12)&0x8000) {
			return MIDIFileHeader.FRAMES_PER_SECONDS;
		}
		return MIDIFileHeader.TICKS_PER_BEAT;
	};

	MIDIFileHeader.prototype.getTicksPerBeat=function() {
		// Reading time division
		var divisionWord=this.datas.getUint16(12);
		if(divisionWord&0x8000) {
			throw new Error('Time division is not expressed as ticks per beat.');
		}
		return divisionWord;
	}

	// Ticks per beat
	MIDIFileHeader.prototype.getTicksPerBeat=function() {
		var divisionWord=this.datas.getUint16(12);
		if(divisionWord&0x8000) {
			throw new Error('Time division is not expressed as ticks per beat.');
		}
		return divisionWord;
	};

	MIDIFileHeader.prototype.setTicksPerBeat=function(ticksPerBeat) {
		this.datas.setUint16(12,ticksPerBeat&0x7FFF);
	};

	// Frames per seconds
	MIDIFileHeader.prototype.getSMPTEFrames=function() {
		var divisionWord=this.datas.getUint16(12), smpteFrames;
		if(!(divisionWord&0x8000)) {
			throw new Error('Time division is not expressed as frames per seconds.');
		}
		smpteFrames=divisionWord&0x7F00;
		if(smpteFrames!=24&&smpteFrames!=25&&smpteFrames!=29&&smpteFrames!=30) {
			throw new Error('Invalid SMPTE frames value ('+smpteFrames+').');
		}
		return (29===smpteFrames?29.97:smpteFrames);
	};

	MIDIFileHeader.prototype.getTicksPerFrame=function() {
		var divisionWord=this.datas.getUint16(12);
		if(!(divisionWord&0x8000)) {
			throw new Error('Time division is not expressed as frames per seconds.');
		}
		return divisionWord&0x00FF;
	};

	MIDIFileHeader.prototype.setSMTPEDivision=function(smpteFrames,ticksPerFrame) {
		if(smpteFrames!=24&&smpteFrames!=25&&smpteFrames!=29.97
				&&smpteFrames!=29&&smpteFrames!=30) {
			throw new Error('Invalid SMPTE frames value given ('+smpteFrames+').');
		}
		if(smpteFrames==29.97)
			smpteFrames=29;
		if(ticksPerFrame<0||ticksPerFrame>0xFF) {
			throw new Error('Invalid ticks per frame value given ('+smpteFrames+').');
		}
		this.datas.setUint8(12,0x80|smpteFrames);
		this.datas.setUint8(13,ticksPerFrame);
	};

	return MIDIFileHeader;

});})(this,typeof define === 'function' && define.amd ?
	// AMD
	define :
	// NodeJS
	(typeof exports === 'object'?function (name, deps, factory) {
		var root=this;
		if(typeof name === 'object') {
			factory=deps; deps=name;
		}
		module.exports=factory.apply(this, deps.map(function(dep){
			return require(dep);
		}));
	}:
	// Global
	function (name, deps, factory) {
		var root=this;
		if(typeof name === 'object') {
			factory=deps; deps=name;
		}
		this.MIDIFileHeader=factory.apply(this, deps.map(function(dep){
			return root[dep.substring(dep.lastIndexOf('/')+1)];
		}));
	}.bind(this)
	)
);