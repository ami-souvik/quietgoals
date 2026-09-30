import { MoodType } from "./types";

export const CONFIG: Record<MoodType, { images: string[] }> = {
    calm: {
        images: [
            'https://cdn.pixabay.com/photo/2026/01/02/17/42/snow-10049005_1280.jpg',
            'https://cdn.pixabay.com/photo/2018/10/05/10/56/landscape-3725657_1280.jpg'
        ]
    },
    focused: {
        images: [
            'https://cdn.pixabay.com/photo/2026/01/02/17/42/snow-10049005_1280.jpg'
        ]
    },
    grounded: {
        images: [
            'https://cdn.pixabay.com/photo/2026/01/02/17/42/snow-10049005_1280.jpg'
        ]
    },
    ambitious: {
        images: [
            'https://cdn.pixabay.com/photo/2016/11/21/17/41/star-trails-1846734_1280.jpg',
            'https://cdn.pixabay.com/photo/2022/06/25/08/43/space-7283103_1280.jpg',
            'https://cdn.pixabay.com/photo/2016/11/21/12/30/milky-way-1845068_1280.jpg',
            'https://cdn.pixabay.com/photo/2016/11/29/10/02/pile-1868894_1280.jpg'
        ]
    }
}