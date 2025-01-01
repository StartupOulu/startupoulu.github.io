// navbar toggle
const toggle_btn = document.querySelector('.toggle_btn');
const mobile_nav_bar = document.querySelector('.mobile_nav_bar');
const close_btn = document.querySelector('.close_btn');

toggle_btn.addEventListener('click', () => {
    mobile_nav_bar.classList.add('active');
    mobile_nav_bar.style.transition = '1s';
});
close_btn.addEventListener('click', () => {
    mobile_nav_bar.classList.remove('active');
    mobile_nav_bar.style.transition = '1s';
});

// for carousel
$('.event_wrapper').slick({
    dots: true,
    infinite: false,
    speed: 300,
    slidesToShow: 3,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 992,
        settings: {
          // centerMode: true,
          // centerPadding: '30px',
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        
        breakpoint: 767,
        settings: {
          centerMode: true,
          centerPadding: '30px',
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  });

  // counter
  $('.counter').counterUp({
    delay: 20,
    time: 2000
});
