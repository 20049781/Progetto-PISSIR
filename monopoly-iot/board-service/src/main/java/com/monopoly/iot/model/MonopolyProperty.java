package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "monopoly_properties")
public class MonopolyProperty {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tagged_object_id", unique = true)
    private Long taggedObjectId;

    @Column(name = "property_code", nullable = false, unique = true)
    private String propertyCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "purchase_price", nullable = false)
    private Integer purchasePrice;

    @Column(name = "base_rent", nullable = false)
    private Integer baseRent;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTaggedObjectId() {
        return taggedObjectId;
    }

    public void setTaggedObjectId(Long taggedObjectId) {
        this.taggedObjectId = taggedObjectId;
    }

    public String getPropertyCode() {
        return propertyCode;
    }

    public void setPropertyCode(String propertyCode) {
        this.propertyCode = propertyCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getPurchasePrice() {
        return purchasePrice;
    }

    public void setPurchasePrice(Integer purchasePrice) {
        this.purchasePrice = purchasePrice;
    }

    public Integer getBaseRent() {
        return baseRent;
    }

    public void setBaseRent(Integer baseRent) {
        this.baseRent = baseRent;
    }

}
