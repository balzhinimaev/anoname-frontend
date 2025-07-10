import React, { useEffect } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
  onClickOutside?: () => void;
  isVisible: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onEmojiSelect, 
  onClickOutside, 
  isVisible 
}) => {
  useEffect(() => {
    init({ data });
    console.log('EmojiPicker mounted');
  }, []);

  if (!isVisible) return null;

  console.log('EmojiPicker visible');

  return (
    <div className="emoji-picker-container">
      <div className="emoji-picker-backdrop" onClick={onClickOutside} />
      <div className="emoji-picker-content">
        <Picker
          data={data}
          onEmojiSelect={onEmojiSelect}
          onClickOutside={onClickOutside}
          theme="auto"
          set="native"
          previewPosition="none"
          skinTonePosition="search"
          searchPosition="sticky"
          perLine={8}
          maxFrequentRows={2}
        />
      </div>
    </div>
  );
};

export default EmojiPicker; 