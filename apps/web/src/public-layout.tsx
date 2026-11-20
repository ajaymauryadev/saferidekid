import type {ReactNode} from 'react';
import {PremiumPublicHeader,PremiumPublicFooter} from './public-shell';

export function PublicLayout({children}:{children:ReactNode}){return <><PremiumPublicHeader/><main id="main-content">{children}</main><PremiumPublicFooter/></>}
