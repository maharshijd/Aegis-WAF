import React from 'react';

const MessageBubble = ({ message, isOwn }) => {
    return (
        <div className={`message-bubble-wrapper ${isOwn ? 'own' : ''}`}>
            <div className={`message ${isOwn ? 'sent' : ''}`}>
                {message.text}
            </div>
        </div>
    );
};

export default MessageBubble;
