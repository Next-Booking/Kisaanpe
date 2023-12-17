ham = document.querySelector("#hamburger_button")
nav = document.querySelector(".header__nav-section_ham")

ham.addEventListener("click", function(){
    let dsp = window.getComputedStyle(nav).display
    if(dsp == "none"){
        nav.style.display = "block"
    }

})
document.addEventListener("click", function(e){
    if(e.target != ham){
        let turnoff = true;
        let path = e.composedPath()

        for(let i of path){
            if(i.classList ){
                if(!i.classList.contains("header__nav-section_ham")){
                    turnoff = true;
                }
                else{
                    turnoff = false;
                    break;
                }
            }
    
        }
        if(turnoff){
            nav.style.display = "none"
        }
    }

})