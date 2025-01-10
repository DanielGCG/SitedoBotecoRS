function ciclo1() {
    startBlockCreation("bottomVerticalLine", 1000, 100);

    setTimeout(() => {
        startBlockCreation("topVerticalLine", 1000, 300);
        setTimeout(() => {
            startBlockCreation("leftHorizontalLine", 1000, 400);
            setTimeout(() => {
                startBlockCreation("rightHorizontalLine", 1000, 200);
                setTimeout(() => {
                    startBlockCreation("rightHorizontalLine", 1000, 200);
                    setTimeout(() => {
                        startBlockCreation("rightHorizontalLine", 1000, 200);
                    }, 500);
                }, 500);
            }, 500);
        }, 500);
    }, 500);
}