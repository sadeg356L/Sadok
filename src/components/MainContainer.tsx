import { PropsWithChildren, useEffect } from "react";
import { useLoading } from "../context/loadingContext";
import About from "./About";
import Approach from "./Approach";
import Contact from "./Contact";
import Cursor from "./Cursor";
import Footer from "./Footer";
import Landing from "./Landing";
import Navbar from "./Navbar";
import Skills from "./Skills";
import SocialIcons from "./SocialIcons";
import Work from "./Work";
import { initReveals } from "./utils/GsapScroll";
import { initialFX } from "./utils/initialFX";

const MainContainer = ({ children }: PropsWithChildren) => {
  const { isIntroDone } = useLoading();

  useEffect(() => {
    return initReveals();
  }, []);

  useEffect(() => {
    if (!isIntroDone) return;
    return initialFX();
  }, [isIntroDone]);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />

      <Landing>{children}</Landing>
      <About />
      <Approach />
      <Skills />
      <Work />
      <Contact />
      <Footer />
    </div>
  );
};

export default MainContainer;
