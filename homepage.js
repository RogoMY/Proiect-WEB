document.addEventListener('DOMContentLoaded', () => {
    const smallBar = document.getElementById('small-bar');
  
    smallBar.addEventListener('click', function() {
      smallBar.classList.toggle('active');
    });
  
    // Vezi unde iti da redirect linkul
    const menuLinks = smallBar.querySelectorAll('.menu a');
    menuLinks.forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault(); 
        const href = link.getAttribute('href'); // Vezi unde iti da redirect linkul
        // Vezi unde dadea redirect linkul ala
        window.location.href = href;
      });
    });
  
    const searchBar = document.querySelector('.search-bar');
    const unfoldBar = document.querySelector('.unfold-bar');
  
    function alignSearchBar() {
      if (unfoldBar.classList.contains('active')) {
        const unfoldBarHeight = unfoldBar.clientHeight;
        searchBar.style.marginTop = `${unfoldBarHeight + 10}px`;
      } else {
        searchBar.style.marginTop = ''; // daca nu e aleasa bara
      }
    }
  
    alignSearchBar();
  
    window.addEventListener('resize', alignSearchBar);
  });
  