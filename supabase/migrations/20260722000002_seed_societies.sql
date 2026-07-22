-- Seed major societies in Bangalore with realistic coordinates
INSERT INTO public.societies (name, city, latitude, longitude)
VALUES
    ('Prestige Shantiniketan, Whitefield', 'Bangalore', 12.9894, 77.7281),
    ('Prestige Lakeside Habitat, Varthur', 'Bangalore', 12.9515, 77.7432),
    ('Brigade Gateway, Rajajinagar', 'Bangalore', 13.0118, 77.5552),
    ('Sobha Clovelly, Padmanabhanagar', 'Bangalore', 12.9090, 77.5606),
    ('DLF New Heights, Bannerghatta Road', 'Bangalore', 12.8715, 77.6010),
    ('L&T South City, JP Nagar', 'Bangalore', 12.8885, 77.5955),
    ('Adarsh Palm Retreat, Bellandur', 'Bangalore', 12.9238, 77.6830),
    ('Sobha Jasmine, Bellandur', 'Bangalore', 12.9265, 77.6795)
ON CONFLICT DO NOTHING;
