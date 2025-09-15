$(document).ready(function () {
  let aianaHero = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-hero",
      start: "top center",
    },
  });
  setTimeout(function () {
    $(".loader").addClass("loaded");
  }, 3000);

  var sideImgs = $(".sideImg img").get().reverse();
  const progressCounter = $(".progressSingle h2 span");

  setTimeout(function () {
    $(".obj").addClass("animateBall");
    $(sideImgs).each(function (index) {
      aianaHero.from($(this), {
        xPercent: -200,
        scale: 1.3,
        duration: 0.5,
      });
    });

    $("nav").addClass("transitionNav");

    $("body").append(
      '<div class="backToTop"><i class="fa-solid fa-arrow-up"></i></div>'
    );

    scrollbar.addListener((status) => {
      const offset = status.offset;

      if (offset.y >= 500) {
        $("nav").addClass("sticky");
        $(".sticky").css("top", offset.y + "px");
        $(".backToTop").css({ opacity: "1", transform: "translateY(0px)" });
        setTimeout(() => {
          $("nav").removeClass("transitionNav");
        }, 1000);
      } else {
        $("nav").css("top", 0 + "px");
        $("nav").removeClass("sticky");
        $(".backToTop").css({ opacity: "0", transform: "translateY(100%)" });
        $("nav").addClass("transitionNav");
      }
      $(".mobNavInner").css("top", offset.y + "px");
    });

    $(".backToTop").on("click", function (e) {
      const target = $("#top");
      const targetEl = $(target);
      const targetRect = targetEl.offset();
      e.preventDefault();
      gsap.to(scrollbar, {
        scrollTo: targetRect.top,
        duration: 2.5,
        ease: "power4.inOut",
        onCompleteParams: [targetRect.top],
      });
    });
    aianaHero.from(
      progressCounter,
      {
        textContent: 0,
        duration: 4,
        snap: { textContent: 1 },
      },
      0
    );
  }, 3000);
  function menu(menuIcon) {
    menuIcon.parent().toggleClass("menuActive");
  }
  $(".menuIcon").on("click", function () {
    menu((menuIcon = $(this)));
  });
  const ScrollArea = document.getElementById("scroll-content");
  const options = {
    damping: 0.1,
    speed: 1,
    renderByPixel: true,
    continuousScrolling: true,
    syncCallbacks: true,
    alwaysShowTracks: false,
  };
  var scrollbar = Scrollbar.init(ScrollArea, options);

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

  scrollbar.addListener(ScrollTrigger.update);
  ScrollTrigger.defaults({ scroller: ScrollArea });

  ScrollTrigger.scrollerProxy("#scroll-content", {
    scrollTop(value) {
      if (arguments.length) {
        scrollbar.scrollTop = value;
      }
      return scrollbar.scrollTop;
    },
  });
  scrollbar.addListener(ScrollTrigger.update);
  ScrollTrigger.defaults({ scroller: ScrollArea });

  $(".aiana-menu li").each(function () {
    var text = $(this).children("a").text();

    $(this).children(".dup,.sup").text(text);
  });

  let aianaHero2 = gsap.timeline({
    scrollTrigger: {
      scrub: true,
      pin: true,
      start: "center center",
    },
  });
  aianaHero2.to(".obj", {
    yPercent: 100,
    duration: 1,
  });

  let aianaFeaures = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-Feature-1",
      pin: true,
      scrub: 1,
      start: "center center",
    },
  });

  aianaFeaures.from(".featureSingle", {
    x: 1500,
    skewX: "10deg",
    skewY: "10deg",
    duration: 2,
  });
  $(".animateScrollText").each(function () {
    gsap.from(
      $(this),
      {
        scrollTrigger: {
          trigger: $(this),
          scrub: true,
          start: "center bottom",
        },

        y: 70,
        opacity: 0,
      },
      100
    );
  });

  let aianaProjects = gsap.timeline({
    scrollTrigger: {
      trigger: "#projects-content",
    },
  });

  aianaProjects.from(".active .project-single", {
    y: 80,
    skew: "100deg",
    scale: 0.5,
  });
  aianaProjects.to(".active .project-single", {
    y: 0,
    skewY: "0",
    scale: 1,
  });

  let circleImg = gsap.timeline({
    scrollTrigger: {
      trigger: ".circleImg",
      endTrigger: ".aiana-gallery",
      scrub: true,
      start: "center center",
      end: "bottom 10%",
    },
  });

  let animation1 = gsap.timeline({
    scrollTrigger: {
      trigger: ".aianaFeature-2",
      start: "center center",
      end: "bottom top",
      scrub: true,
    },
  });
  animation1.to(".circleImg", {
    xPercent: -130,
    scale: 1.25,
  });
  circleImg.add(animation1);

  gsap.to(".gradient-h1.text-end", {
    xPercent: -100,
    opacity: 0,
    scrollTrigger: {
      trigger: ".aianaFeature-2",
      start: "top center",
      end: "bottom center",
      scrub: 1,
    },
  });

  gsap.to(".gradient-h1.text-start", {
    xPercent: 100,
    opacity: 0,
    scrollTrigger: {
      trigger: ".aianaFeature-2",
      start: "center center",
      end: "bottom center",
      scrub: 1,
    },
  });

  let fadeOutAnimation = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-details-2",
      start: "bottom center",
      scrub: true,
    },
  });
  fadeOutAnimation.to(".circleImg", {
    scale: 0,
    opacity: 0,
    yPercent: 100,
    xPercent: 0,
    duration: 1,
  });

  circleImg.add(fadeOutAnimation);

  // marquee
  $(".marquee").marquee({
    speed: 200,
    gap: 50,
    delayBeforeStart: 0,
    direction: "left",
    duplicated: true,
    pauseOnHover: false,
  });

  let projectTab = gsap.timeline({
    scrollTrigger: {
      trigger: "#projects-tab",
      start: "center center",
      end: "center 10%",
      pin: true,
    },
  });

  let aianaDetails = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-details",
      start: "top center",
    },
  });

  aianaDetails.from(".detailsImg img", {
    opacity: 0,
    x: 100,
  });
  let aianaPriceTable = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-priceTable",
      pin: true,
      scrub: 1,
      start: "30% center",
    },
  });

  aianaPriceTable.from(".priceTable", {
    x: -1200,
    skewX: "10deg",
    skewY: "10deg",
    scale: 0.5,
    duration: 1.5,
  });
  let aiaanaGallery = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-gallery",
      scrub: true,
      start: "top center",
      end: "bottom 10%",
    },
  });

  aiaanaGallery.from(".gallery img", {
    skewX: "10deg",
    skewY: "10deg",
    yPercent: 50,
    scale: 0.5,
  });
  aiaanaGallery.to(".gallery img", {
    skewX: "0deg",
    skewY: "0deg",
    yPercent: 0,

    scale: 1,
  });

  let aianaVideo = gsap.timeline({
    scrollTrigger: {
      trigger: ".aiana-video",
      start: "center center",
      end: "bottom 10%",
    },
  });
  let aianaServices = gsap.timeline({
    scrollTrigger: {
      trigger: ".servicedetails",
      scrub: 1,
      start: "top center",
    },
  });
  aianaServices.from(".serviceSide", {
    xPercent: 100,
    duration: 1,
  });

  $(".startplay").on("click", function () {
    const getParent = $(this).closest(".video-block");
    const getVideo = getParent.find("iframe");
    getVideo.css("display", "block");
    getParent.find(".close").css("display", "block");
    var symbol = getVideo[0].src.indexOf("?") > -1 ? "&" : "?";

    if (getVideo[0].src.indexOf("autoplay") === -1) {
      getVideo[0].src += symbol + "autoplay=1";
    } else {
      getVideo[0].src = getVideo[0].src.replace(/autoplay=0/, "autoplay=1");
    }
  });

  $(".close").on("click", function () {
    const getParent = $(this).closest(".video-block");
    const getVideo = getParent.find("iframe");
    getVideo.css("display", "none");

    var symbol = getVideo[0].src.indexOf("?") > -1 ? "&" : "?";

    if (getVideo[0].src.indexOf("autoplay") === -1) {
      getVideo[0].src += symbol + "autoplay=0";
    } else {
      getVideo[0].src = getVideo[0].src.replace(/autoplay=1/, "autoplay=0");
    }

    $(this).css("display", "none");
  });

  $(".serviceSingle").each(function (index) {
    aianaServices.from($(this), {
      y: 50 * index,
      opacity: 0,
    });
  });

  var topPosition = $(".aiana-details").css("top");
  console.log(topPosition);
  $(".aiana-details").css("padding-top", topPosition.replace("-", ""));

  var shaderSlide;

  function initSwiper() {
    shaderSlide = new Swiper(".shaderSlide", {
      modules: [SwiperGL],
      simulateTouch: false,
      effect: "gl",
      gl: {
        shader: "morph-x",
      },
      speed: 1000,
      pagination: {
        el: ".aiana-details-pagination",
        clickable: true,
      },
      autoplay: {
        delay: 1500,
        disableOnInteraction: false,
      },
    });
  }

  function handleBreakpointChange(e) {
    if (e.matches) {
      if (shaderSlide) {
        shaderSlide.destroy(true, true);
        shaderSlide = null;
      }
    } else {
      if (!shaderSlide) {
        initSwiper();
      }
    }
  }

  var breakpoint = window.matchMedia("(max-width: 767px)");
  breakpoint.addEventListener("change", handleBreakpointChange);

  handleBreakpointChange(breakpoint);

  const circleText = new CircleType(
    document.querySelector(".aiana-video span")
  );

  $(".accordion-header button").on("click", function () {
    var accordionItem = $(this).closest(".accordion-item");
    var img = accordionItem.find("img");
    $(".accordion-item img").removeClass("active");
    if ($(this).hasClass("collapsed")) {
      img.removeClass("active");
      fffffff;
    } else {
      img.addClass("active");
    }
  });


  var swiperTestimonials = new Swiper(".swiperTestimonials", {
    grabCursor: false,
    effect: "fade",
    loop: true,
    thumbs: {
      swiper: Thumbnails,
    },
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
  });

  var Thumbnails = new Swiper(".testimonialThumb", {
    direction: "vertical",

    slidesPerView: 2,
    thumbs: {
      swiper: swiperTestimonials,
    },
  });
   function getRandomWord() {
  const words = ["AudioInput", "Speech", "Voice", "Text", "Processing", "Recognition", "Analysis", "Conversion", "Language", "Microphone"];
  return words[Math.floor(Math.random() * words.length)];
}

function scrambleText(text, revealPercentage) {
  const words = text.split(" ");
  return words
    .map((word, i) => {
      return Math.random() < revealPercentage ? word : getRandomWord();
    })
    .join(" ");
}
  function animateToOriginal(element, originalText, duration) {
    let revealPercentage = 0;
    const intervalTime = 100;
    const steps = duration / intervalTime;

    const interval = setInterval(function () {
      revealPercentage += 1 / steps;
      element.text(scrambleText(originalText, revealPercentage));

      if (revealPercentage >= 1) {
        clearInterval(interval);
        element.text(originalText);
      }
    }, intervalTime);
  }

  const scrambleElement = $(".loaderText");
  const originalText = scrambleElement.data("original");
  const totalDuration = 2000;

  animateToOriginal(scrambleElement, originalText, totalDuration);

  $(".navMenu li a").each(function (e) {
    const target = $(this).attr("href");
    const targetEl = $(target);
    const targetRect = targetEl.offset();

    $(this).on("click", function (e) {
      menu($(".menuIcon"));
      var setOffset = 0;
      if (target == "#video") {
        setOffset = -120;
      } else {
        setOffset = 70;
      }

      e.preventDefault();
      gsap.to(scrollbar, {
        scrollTo: targetRect.top + setOffset,
        duration: 2.5,
        ease: "power4.inOut",
        onCompleteParams: [targetRect.top],
      });

      $(".aiana-menu li a").removeClass("active");
      $(this).addClass("active");
    });
  });

  ScrollTrigger.matchMedia({
    "(max-width: 768px)": function () {
      circleImg.clear();
      circleImg.revert();

      aianaFeaures.clear();
      aianaFeaures.revert();
      gsap.set(".featureSingle", {
        clearProps: "all",
      });

      aianaPriceTable.clear();
      aianaPriceTable.revert();
      gsap.set(".priceTable", {
        clearProps: "all",
      });
    },
  });
});
