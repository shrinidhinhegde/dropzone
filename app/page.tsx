"use client"

import {Button} from "@/components/ui/button"
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {DropzoneField} from "@/components/DropZone";
import React from "react";

export default function Home() {
  const z_form = z.object({
    file: z.array(z.instanceof(File)), // z.instanceof(File) for single file and z.array(z.instanceof(File)) for multiple files
    // file: z.instanceof(File),
    filePaths: z.record(z.string(), z.string()),
  })
  const form = useForm<z.infer<typeof z_form>>({
    resolver: zodResolver(z_form),
    defaultValues: {
      file: undefined,
      filePaths: {},
    }
  });

  const onSubmit = () => {
    console.log(form.getValues())
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="file"
            render={({field}) => (
              <FormItem>
                <FormLabel>Files</FormLabel>
                <FormControl>
                  <DropzoneField
                    multiple={true}
                    filePathName="filePaths"
                    destinationPathPrefix="uploads"
                    description="Any additional information can be added here"
                    {...field}
                  />
                </FormControl>
                <FormMessage/>
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
      <div className="flex flex-col space-y-2 mt-4">
        {Object.entries(form.getValues().filePaths).map(([name, path]) => (
          <div key={name} className="flex items-center space-x-2">
            <span>{name}</span>
            <span>{path}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
