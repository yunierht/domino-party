import React from 'react';
/** Test adapter for unrelated screen mechanics; the actual circle has its own test. */
export const modalCloseMock={ModalCloseButton:({testID,es=true,...props})=>React.createElement('Pressable',{...props,accessibilityRole:'button',accessibilityLabel:es?'Cerrar':'Close'})};
