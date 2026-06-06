package com.monopoly.iot.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tagged_objects")
public class TaggedObject {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tag_uid", nullable = false, unique = true)
    private String tagUid;

    @Column(name = "object_type", nullable = false)
    private String objectType;

    @Column(nullable = false)
    private String label;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTagUid() {
        return tagUid;
    }

    public void setTagUid(String tagUid) {
        this.tagUid = tagUid;
    }

    public String getObjectType() {
        return objectType;
    }

    public void setObjectType(String objectType) {
        this.objectType = objectType;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

}
