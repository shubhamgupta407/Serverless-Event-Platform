import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import '../styles/Marquee.css';

const MarqueeItem = ({ text }) => (
    <>
        <span>{text}</span>
        <span className="separator">✦</span>
    </>
);

const MarqueeText = () => {
    const items = [
    "TECH EVENTS",
    "HACKATHONS", 
    "WORKSHOPS",
    "LPU",
    "REGISTER NOW",
    "GET YOUR TICKET",
    "LIVE ANNOUNCEMENTS",
    "CODE A HAUNT 3.0"
    ];

    return (
        <React.Fragment>
            {items.map((item, index) => (
                <MarqueeItem key={index} text={item} />
            ))}
        </React.Fragment>
    );
};

const Marquee = () => {
    const { scrollY } = useScroll();

    const xPrimary = useTransform(() => scrollY.get() * -0.5);
    const xSecondary = useTransform(() => scrollY.get() * 0.5);

    return (
        <div className="marquee-container">
            {/* The white band tilting down, scrolling right */}
            <div className="marquee-band secondary">
                <motion.div
                    className="marquee-content scroll-right"
                    style={{ x: xSecondary, marginLeft: '-150vw' }} // Offset heavily to the left so it has plenty of track to pull right
                >
                    {[...Array(12)].map((_, i) => <MarqueeText key={i} />)}
                </motion.div>
            </div>

            {/* The purple band tilting up, scrolling left */}
            <div className="marquee-band primary">
                <motion.div
                    className="marquee-content scroll-left"
                    style={{ x: xPrimary, marginLeft: '-50vw' }} // Offset left slightly to give margin for scrolling
                >
                    {[...Array(12)].map((_, i) => <MarqueeText key={i} />)}
                </motion.div>
            </div>
        </div>
    )
}

export default Marquee
