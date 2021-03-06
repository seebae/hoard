//
//  NVSeparatorView.h
//  JMBaseInfoTest
//
//  Copyright © 2016 Jumio Corporation All rights reserved.
//

#import <UIKit/UIKit.h>

extern const CGFloat kJMSeparatorViewDefaultWidth;
extern const CGFloat kJMSeparatorViewDefaultHeight;

__attribute__((visibility("default"))) @interface JMSeparatorView : UIView

- (id)initWithSize:(CGSize)size;

- (void)initSeparatorView;

@end
