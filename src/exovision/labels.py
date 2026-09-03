"""The five candidate categories the pipeline sorts signals into.

Ordering matters: the integer value of each member is the class index used by
the classifier, so it must stay stable once a model has been trained.
"""

from __future__ import annotations

from enum import IntEnum


class Category(IntEnum):
    """Outcome of vetting a periodic signal."""

    EXOPLANET_TRANSIT = 0
    ECLIPSING_BINARY = 1
    STELLAR_BLEND = 2
    STARSPOT = 3
    NOISE = 4

    @property
    def slug(self) -> str:
        return self.name.lower()

    @property
    def label(self) -> str:
        return CATEGORY_LABELS[self]

    @classmethod
    def from_any(cls, value: "Category | int | str") -> "Category":
        """Accept an enum, a class index, or a slug/label string."""
        if isinstance(value, cls):
            return value
        if isinstance(value, (int,)) and not isinstance(value, bool):
            return cls(int(value))
        key = str(value).strip().lower().replace(" ", "_").replace("-", "_")
        for member in cls:
            if key in (member.slug, member.name.lower(), member.label.lower()):
                return member
        raise ValueError(f"unknown category: {value!r}")


CATEGORIES: tuple[Category, ...] = tuple(Category)

CATEGORY_LABELS: dict[Category, str] = {
    Category.EXOPLANET_TRANSIT: "Exoplanet transit",
    Category.ECLIPSING_BINARY: "Eclipsing binary",
    Category.STELLAR_BLEND: "Stellar blend",
    Category.STARSPOT: "Starspot",
    Category.NOISE: "Noise",
}

# One-line description of what each category physically means. Surfaced in the
# dashboard so a viewer does not need the paper to read the classification.
CATEGORY_DESCRIPTIONS: dict[Category, str] = {
    Category.EXOPLANET_TRANSIT: (
        "Flat-bottomed periodic dip, no secondary eclipse, odd and even depths "
        "agree, and the implied stellar density is consistent with the host."
    ),
    Category.ECLIPSING_BINARY: (
        "Two stars eclipsing each other — deep and often V-shaped, with a "
        "secondary eclipse near phase 0.5 or mismatched odd/even depths."
    ),
    Category.STELLAR_BLEND: (
        "A real eclipse diluted by a neighbouring star inside the aperture. "
        "The depth looks planetary but the shape and density do not."
    ),
    Category.STARSPOT: (
        "Rotational modulation from spots crossing the visible disc — smooth, "
        "quasi-periodic and sinusoidal rather than a discrete transit."
    ),
    Category.NOISE: (
        "No coherent transit: the periodogram peak is consistent with "
        "photometric scatter or an instrumental systematic."
    ),
}

# Which categories count as a genuine planet for the binary planet/false-positive
# head that runs alongside the five-way classifier.
PLANET_CATEGORIES: frozenset[Category] = frozenset({Category.EXOPLANET_TRANSIT})

__all__ = [
    "Category",
    "CATEGORIES",
    "CATEGORY_LABELS",
    "CATEGORY_DESCRIPTIONS",
    "PLANET_CATEGORIES",
]
