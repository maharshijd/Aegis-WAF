import React, { useState, useRef, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useAuth } from '../../context/AuthContext';

const MessageInput = ({ onSend, onTyping }) => {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const { authAxios } = useAuth();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim() && !uploading) return;
        onSend(text);
        setText('');
        setShowEmoji(false);
        onTyping(false);
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        onTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
    };

    const handleEmojiSelect = (emoji) => {
        setText((prev) => prev + emoji.native);
    };

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await authAxios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            onSend('', res.data.fileUrl, res.data.fileType);
        } catch (err) {
            console.error('File upload failed:', err);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }, [authAxios, onSend]);

    return (
        <div className="message-input-bar" style={{ position: 'relative' }}>
            {/* Emoji Picker */}
            {showEmoji && (
                <div className="emoji-picker-container">
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" skinTonePosition="none" />
                </div>
            )}

            <div className="input-actions">
                {/* Attachment */}
                <button
                    className="action-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    disabled={uploading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.mp4,.mp3"
                />
            </div>

            {/* Text Input */}
            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Type a message"
                    autoComplete="off"
                />

                {/* Emoji Toggle */}
                <button
                    type="button"
                    className="action-btn"
                    onClick={() => setShowEmoji(!showEmoji)}
                    title="Emoji"
                >
                    😊
                </button>

                {/* Send Button */}
                <button type="submit" className="send-btn" disabled={!text.trim() && !uploading}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
